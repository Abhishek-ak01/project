-- ============================================================================
-- LocalLoop: Supabase PostgreSQL Schema, RLS Policies, and Atomic Order Trigger
-- Hackathon Project: Local Small Business Digital Marketplace
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('customer', 'seller', 'admin')) default 'customer',
  phone text,
  neighborhood text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. SELLERS (Storefront profiles)
create table if not exists public.sellers (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  store_name text not null,
  slug text unique not null,
  tagline text,
  description text,
  address text not null,
  neighborhood text not null,
  phone text not null,
  email text not null,
  rating numeric(3, 2) default 5.00,
  review_count int default 0,
  is_verified boolean default false,
  banner_url text,
  logo_url text,
  badges text[] default '{}',
  delivery_available boolean default true,
  pickup_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CATEGORIES
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text unique not null,
  icon text,
  description text
);

-- 4. PRODUCTS (Provisions with live inventory)
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid references public.sellers(id) on delete cascade not null,
  category_id text references public.categories(id) not null,
  title text not null,
  slug text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  unit text not null default 'item',
  images text[] default '{}',
  rating numeric(3, 2) default 5.00,
  review_count int default 0,
  is_available boolean default true,
  is_featured boolean default false,
  is_organic boolean default false,
  is_moderated boolean default false,
  moderation_reason text,
  badges text[] default '{}',
  origin_neighborhood text,
  shelf_life text,
  dietary text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ORDERS & ORDER ITEMS
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,
  customer_id uuid references public.profiles(id) not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  seller_id uuid references public.sellers(id) not null,
  status text not null check (status in ('placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')) default 'placed',
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  tax numeric(10, 2) not null default 0 check (tax >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  payment_status text not null default 'simulated_paid',
  payment_method text not null default 'card_demo',
  delivery_type text not null check (delivery_type in ('local_delivery', 'pickup')),
  delivery_address jsonb,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  seller_id uuid references public.sellers(id) not null,
  product_title text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0)
);

-- 6. MODERATION LOGS (Admin oversight)
create table if not exists public.moderation_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references public.profiles(id) not null,
  target_type text not null check (target_type in ('product', 'seller')),
  target_id uuid not null,
  target_name text,
  action text not null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.sellers enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.moderation_logs enable row level security;

-- Public read access for marketplace browsing
create policy "Categories are viewable by everyone" on public.categories for select using (true);
create policy "Active products viewable by everyone" on public.products for select using (is_available = true);
create policy "Sellers viewable by everyone" on public.sellers for select using (true);

-- Sellers can manage only their own products
create policy "Sellers manage own products" on public.products
  for all using (
    exists (
      select 1 from public.sellers
      where public.sellers.id = public.products.seller_id
      and public.sellers.owner_id = auth.uid()
    )
  );

-- Customers can view only their own orders
create policy "Customers view own orders" on public.orders
  for select using (customer_id = auth.uid());

-- Sellers can view orders containing their provisions
create policy "Sellers view their orders" on public.orders
  for select using (
    exists (
      select 1 from public.sellers
      where public.sellers.id = public.orders.seller_id
      and public.sellers.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- ATOMIC INVENTORY & ORDER CHECKOUT RPC (Server-Side Price & Stock Authority)
-- ============================================================================
create or replace function public.process_atomic_checkout(
  p_customer_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_seller_id uuid,
  p_delivery_type text,
  p_delivery_address jsonb,
  p_payment_method text,
  p_notes text,
  p_items jsonb -- array of { product_id: uuid, quantity: int }
) returns uuid as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(10, 2) := 0;
  v_tax numeric(10, 2) := 0;
  v_delivery_fee numeric(10, 2) := 0;
  v_total numeric(10, 2) := 0;
  v_item jsonb;
  v_prod record;
  v_item_subtotal numeric(10, 2);
begin
  -- 1. Validate stock and calculate authoritative prices
  for v_item in select * from jsonb_array_elements(p_items) loop
    select id, price, stock_quantity, title into v_prod
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update; -- Lock row to prevent race conditions

    if not found then
      raise exception 'Product % does not exist', (v_item->>'product_id');
    end if;

    if v_prod.stock_quantity < (v_item->>'quantity')::int then
      raise exception 'Insufficient stock for "%". Requested: %, Available: %',
        v_prod.title, (v_item->>'quantity')::int, v_prod.stock_quantity;
    end if;

    v_item_subtotal := v_prod.price * (v_item->>'quantity')::int;
    v_subtotal := v_subtotal + v_item_subtotal;
  end loop;

  -- 2. Calculate authoritative fees
  v_tax := round(v_subtotal * 0.08, 2);
  if p_delivery_type = 'pickup' or v_subtotal >= 35.00 then
    v_delivery_fee := 0.00;
  else
    v_delivery_fee := 3.50;
  end if;
  v_total := v_subtotal + v_tax + v_delivery_fee;

  -- 3. Create Order
  v_order_number := 'LL-' || floor(1000 + random() * 9000)::text;
  insert into public.orders (
    order_number, customer_id, customer_name, customer_email, customer_phone,
    seller_id, status, subtotal, tax, delivery_fee, total_amount,
    payment_status, payment_method, delivery_type, delivery_address, notes
  ) values (
    v_order_number, p_customer_id, p_customer_name, p_customer_email, p_customer_phone,
    p_seller_id, 'placed', v_subtotal, v_tax, v_delivery_fee, v_total,
    'simulated_paid', p_payment_method, p_delivery_type, p_delivery_address, p_notes
  ) returning id into v_order_id;

  -- 4. Decrement Stock & Insert Order Items
  for v_item in select * from jsonb_array_elements(p_items) loop
    select id, price, title into v_prod
    from public.products
    where id = (v_item->>'product_id')::uuid;

    v_item_subtotal := v_prod.price * (v_item->>'quantity')::int;

    update public.products
    set stock_quantity = stock_quantity - (v_item->>'quantity')::int,
        updated_at = now()
    where id = (v_item->>'product_id')::uuid;

    insert into public.order_items (
      order_id, product_id, seller_id, product_title, unit_price, quantity, subtotal
    ) values (
      v_order_id, (v_item->>'product_id')::uuid, p_seller_id, v_prod.title,
      v_prod.price, (v_item->>'quantity')::int, v_item_subtotal
    );
  end loop;

  return v_order_id;
end;
$$ language plpgsql security definer;
