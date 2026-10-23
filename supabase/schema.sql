-- ============================================================================
-- LocalLoop: Complete Consolidated PostgreSQL Database Schema, RLS & Stored Procedures
-- Hackathon MVP: Local Small Business Digital Marketplace
-- Run this script in the Supabase SQL Editor to set up all tables, security, and triggers.
-- ============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROFILES (Extends auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) >= 2),
  role text not null check (role in ('customer', 'seller', 'admin')) default 'customer',
  phone text,
  neighborhood text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. SELLER PROFILES (Verified local merchants & urban growers)
-- ============================================================================
create table if not exists public.seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null check (char_length(trim(business_name)) >= 2),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  business_category text not null,
  city text not null default 'Greenville',
  locality text not null, -- Neighborhood area
  contact_email text not null check (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  contact_phone text not null,
  approval_status text not null check (approval_status in ('pending', 'approved', 'rejected', 'suspended')) default 'pending',
  rating numeric(3, 2) not null default 5.00 check (rating >= 1.00 and rating <= 5.00),
  review_count integer not null default 0 check (review_count >= 0),
  banner_url text,
  logo_url text,
  badges text[] not null default '{}',
  delivery_available boolean not null default true,
  pickup_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_seller_profiles_user unique (user_id)
);

-- ============================================================================
-- 3. CATEGORIES (Standardized market taxonomy)
-- ============================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) >= 2),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  icon text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 4. PRODUCTS (Provisions with live inventory)
-- ============================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null check (char_length(trim(name)) >= 2),
  slug text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0.01),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= price),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  unit text not null default 'item',
  image_url text,
  images text[] not null default '{}',
  is_active boolean not null default true,
  is_organic boolean not null default false,
  is_featured boolean not null default false,
  is_moderated boolean not null default false,
  moderation_reason text,
  dietary text[] not null default '{}',
  shelf_life text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 5. ADDRESSES (Customer saved addresses & delivery locations)
-- ============================================================================
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_name text not null,
  phone text not null,
  street_address text not null,
  city text not null default 'Greenville',
  locality text not null,
  postal_code text not null,
  delivery_instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 6. ORDERS (Authoritative transaction orders)
-- ============================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  seller_id uuid not null references public.seller_profiles(id) on delete restrict,
  order_number text not null unique,
  shipping_details jsonb not null,
  delivery_type text not null check (delivery_type in ('local_delivery', 'pickup')),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  tax numeric(10, 2) not null default 0.00 check (tax >= 0),
  delivery_fee numeric(10, 2) not null default 0.00 check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  order_status text not null check (order_status in ('placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')) default 'placed',
  payment_status text not null check (payment_status in ('pending', 'simulated_paid', 'paid', 'refunded', 'cash_on_delivery')) default 'simulated_paid',
  payment_method text not null default 'card_demo',
  customer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 7. ORDER ITEMS (Historical line-item snapshots)
-- ============================================================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  seller_id uuid not null references public.seller_profiles(id) on delete restrict,
  product_name_snapshot text not null,
  unit_price_snapshot numeric(10, 2) not null check (unit_price_snapshot >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 8. FAVORITES (Saved products wishlist)
-- ============================================================================
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint uq_favorites_user_product unique (user_id, product_id)
);

-- ============================================================================
-- 9. PERFORMANCE INDEXES
-- ============================================================================
create index if not exists idx_seller_profiles_status on public.seller_profiles(approval_status);
create index if not exists idx_seller_profiles_locality on public.seller_profiles(locality);
create index if not exists idx_products_seller on public.products(seller_id);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active) where is_active = true;
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_seller on public.orders(seller_id);
create index if not exists idx_orders_status on public.orders(order_status);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_seller on public.order_items(seller_id);
create index if not exists idx_addresses_user on public.addresses(user_id);
create index if not exists idx_favorites_user on public.favorites(user_id);

-- ============================================================================
-- 10. TRIGGERS: auto-update updated_at
-- ============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_profiles_updated_at on public.profiles;
create trigger tr_profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();

drop trigger if exists tr_seller_profiles_updated_at on public.seller_profiles;
create trigger tr_seller_profiles_updated_at before update on public.seller_profiles for each row execute function public.handle_updated_at();

drop trigger if exists tr_products_updated_at on public.products;
create trigger tr_products_updated_at before update on public.products for each row execute function public.handle_updated_at();

drop trigger if exists tr_orders_updated_at on public.orders;
create trigger tr_orders_updated_at before update on public.orders for each row execute function public.handle_updated_at();

-- ============================================================================
-- 11. SECURITY DEFINER HELPER FUNCTIONS
-- ============================================================================
create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id
    and role = 'admin'
  );
$$;

create or replace function public.get_my_seller_id(p_user_id uuid default auth.uid())
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.seller_profiles
  where user_id = p_user_id
  limit 1;
$$;

create or replace function public.is_approved_seller(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.seller_profiles
    where user_id = p_user_id
    and approval_status = 'approved'
  );
$$;

-- ============================================================================
-- 12. ANTI-PRIVILEGE ESCALATION TRIGGERS
-- ============================================================================
create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    raise exception 'Unauthorized role escalation: only an administrator can change account roles.';
  end if;
  return new;
end;
$$;

drop trigger if exists tr_prevent_role_escalation on public.profiles;
create trigger tr_prevent_role_escalation
  before update of role on public.profiles
  for each row execute function public.prevent_profile_role_escalation();

create or replace function public.prevent_seller_self_approval()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.approval_status <> old.approval_status and not public.is_admin() then
    raise exception 'Unauthorized approval status change: only an administrator can approve, reject, or suspend seller storefronts.';
  end if;
  return new;
end;
$$;

drop trigger if exists tr_prevent_seller_self_approval on public.seller_profiles;
create trigger tr_prevent_seller_self_approval
  before update of approval_status on public.seller_profiles
  for each row execute function public.prevent_seller_self_approval();

-- ============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.favorites enable row level security;

-- Profiles
drop policy if exists "Users can view their own profile or admins view all" on public.profiles;
create policy "Users can view their own profile or admins view all" on public.profiles for select using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Seller Profiles
drop policy if exists "Public can view approved sellers" on public.seller_profiles;
create policy "Public can view approved sellers" on public.seller_profiles for select using (approval_status = 'approved' or user_id = auth.uid() or public.is_admin());

drop policy if exists "Registered users can submit seller profile" on public.seller_profiles;
create policy "Registered users can submit seller profile" on public.seller_profiles for insert with check (user_id = auth.uid() and (approval_status = 'pending' or public.is_admin()));

drop policy if exists "Sellers can update their own storefront" on public.seller_profiles;
create policy "Sellers can update their own storefront" on public.seller_profiles for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

-- Categories
drop policy if exists "Categories are publicly readable" on public.categories;
create policy "Categories are publicly readable" on public.categories for select using (true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- Products
drop policy if exists "Public can view active products from approved sellers" on public.products;
create policy "Public can view active products from approved sellers" on public.products for select using (
  (is_active = true and is_moderated = false and exists (select 1 from public.seller_profiles where public.seller_profiles.id = public.products.seller_id and public.seller_profiles.approval_status = 'approved'))
  or seller_id = public.get_my_seller_id()
  or public.is_admin()
);

drop policy if exists "Sellers can add products to own storefront" on public.products;
create policy "Sellers can add products to own storefront" on public.products for insert with check (seller_id = public.get_my_seller_id() and public.is_approved_seller());

drop policy if exists "Sellers can update own products or admins manage all" on public.products;
create policy "Sellers can update own products or admins manage all" on public.products for update using (seller_id = public.get_my_seller_id() or public.is_admin()) with check (seller_id = public.get_my_seller_id() or public.is_admin());

drop policy if exists "Sellers can delete own products or admins manage all" on public.products;
create policy "Sellers can delete own products or admins manage all" on public.products for delete using (seller_id = public.get_my_seller_id() or public.is_admin());

-- Addresses
drop policy if exists "Users manage their own saved addresses" on public.addresses;
create policy "Users manage their own saved addresses" on public.addresses for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

-- Orders
drop policy if exists "Customers and sellers view their assigned orders" on public.orders;
create policy "Customers and sellers view their assigned orders" on public.orders for select using (customer_id = auth.uid() or seller_id = public.get_my_seller_id() or public.is_admin());

drop policy if exists "Customers can place orders" on public.orders;
create policy "Customers can place orders" on public.orders for insert with check (customer_id = auth.uid());

drop policy if exists "Sellers can update orders for their store" on public.orders;
create policy "Sellers can update orders for their store" on public.orders for update using (seller_id = public.get_my_seller_id() or customer_id = auth.uid() or public.is_admin()) with check (seller_id = public.get_my_seller_id() or customer_id = auth.uid() or public.is_admin());

-- Order Items
drop policy if exists "Permitted users view relevant order items" on public.order_items;
create policy "Permitted users view relevant order items" on public.order_items for select using (
  exists (select 1 from public.orders where public.orders.id = public.order_items.order_id and (public.orders.customer_id = auth.uid() or public.orders.seller_id = public.get_my_seller_id() or public.is_admin()))
);

-- Favorites
drop policy if exists "Users manage their own favorites" on public.favorites;
create policy "Users manage their own favorites" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- 14. ATOMIC ORDER CREATION & INVENTORY DEDUCTION PROCEDURE
-- ============================================================================
create or replace function public.create_order_atomic(
  p_customer_id uuid,
  p_seller_id uuid,
  p_delivery_type text,
  p_shipping_details jsonb,
  p_payment_method text,
  p_customer_notes text,
  p_items jsonb
)
returns table (
  order_id uuid,
  order_number text,
  subtotal numeric,
  tax numeric,
  delivery_fee numeric,
  total numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(10, 2) := 0.00;
  v_tax numeric(10, 2) := 0.00;
  v_delivery_fee numeric(10, 2) := 0.00;
  v_total numeric(10, 2) := 0.00;
  v_item jsonb;
  v_prod record;
  v_line_total numeric(10, 2);
  v_product_id uuid;
  v_qty integer;
  v_seller_status text;
begin
  if auth.uid() is not null and auth.uid() <> p_customer_id and not public.is_admin() then
    raise exception 'Unauthorized: You cannot place orders on behalf of another customer.';
  end if;

  select approval_status into v_seller_status from public.seller_profiles where id = p_seller_id;
  if v_seller_status is null or v_seller_status <> 'approved' then
    raise exception 'Cannot create order: The selected seller storefront is not currently active and approved.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty: At least one product is required to place an order.';
  end if;

  -- Concurrency-safe row locking in consistent order
  for v_item in select value from jsonb_array_elements(p_items) order by (value->>'product_id')::uuid loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity % for product %: Quantity must be greater than zero.', v_qty, v_product_id;
    end if;

    select id, name, price, stock_quantity, is_active, seller_id
    into v_prod
    from public.products
    where id = v_product_id
    for update;

    if not found then
      raise exception 'Product with ID % does not exist.', v_product_id;
    end if;

    if not v_prod.is_active then
      raise exception 'Product "%" is currently deactivated and cannot be ordered.', v_prod.name;
    end if;

    if v_prod.seller_id <> p_seller_id then
      raise exception 'Product "%" belongs to a different seller than the order destination.', v_prod.name;
    end if;

    if v_prod.stock_quantity < v_qty then
      raise exception 'Insufficient stock for "%". Requested: %, Available in stock: %',
        v_prod.name, v_qty, v_prod.stock_quantity;
    end if;

    v_line_total := round(v_prod.price * v_qty, 2);
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  -- Authoritative tax & delivery fee computation
  v_tax := round(v_subtotal * 0.08, 2);
  if p_delivery_type = 'pickup' or v_subtotal >= 35.00 then
    v_delivery_fee := 0.00;
  else
    v_delivery_fee := 3.50;
  end if;
  v_total := v_subtotal + v_tax + v_delivery_fee;

  v_order_number := 'LL-' || lpad(floor(random() * 90000 + 10000)::text, 5, '0');

  insert into public.orders (
    customer_id, seller_id, order_number, shipping_details, delivery_type,
    subtotal, tax, delivery_fee, total, order_status, payment_status,
    payment_method, customer_notes
  ) values (
    p_customer_id, p_seller_id, v_order_number, p_shipping_details, p_delivery_type,
    v_subtotal, v_tax, v_delivery_fee, v_total, 'placed', 'simulated_paid',
    coalesce(p_payment_method, 'card_demo'), p_customer_notes
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;

    select id, name, price into v_prod from public.products where id = v_product_id;
    v_line_total := round(v_prod.price * v_qty, 2);

    update public.products
    set stock_quantity = stock_quantity - v_qty, updated_at = now()
    where id = v_product_id;

    insert into public.order_items (
      order_id, product_id, seller_id, product_name_snapshot, unit_price_snapshot, quantity, line_total
    ) values (
      v_order_id, v_product_id, p_seller_id, v_prod.name, v_prod.price, v_qty, v_line_total
    );
  end loop;

  return query select v_order_id, v_order_number, v_subtotal, v_tax, v_delivery_fee, v_total;
end;
$$;

-- ============================================================================
-- 15. PERMITTED SELLER STATUS TRANSITIONS & STOCK RESTORATION
-- ============================================================================
create or replace function public.transition_order_status(
  p_order_id uuid,
  p_new_status text,
  p_reason text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_my_seller_id uuid;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found.';
  end if;

  v_my_seller_id := public.get_my_seller_id();

  if v_order.seller_id <> v_my_seller_id and not public.is_admin() then
    if v_order.customer_id = auth.uid() and p_new_status = 'cancelled' and v_order.order_status = 'placed' then
      -- Authorized customer cancellation
    else
      raise exception 'Unauthorized to transition order status.';
    end if;
  end if;

  if v_order.order_status = 'placed' and p_new_status not in ('confirmed', 'cancelled') then
    raise exception 'Invalid transition: Placed orders can only be confirmed or cancelled.';
  elsif v_order.order_status = 'confirmed' and p_new_status not in ('preparing', 'cancelled') then
    raise exception 'Invalid transition: Confirmed orders can only move to preparing or cancelled.';
  elsif v_order.order_status = 'preparing' and p_new_status not in ('ready', 'cancelled') then
    raise exception 'Invalid transition: Preparing orders can only move to ready or cancelled.';
  elsif v_order.order_status = 'ready' and p_new_status not in ('completed') then
    raise exception 'Invalid transition: Ready orders can only move to completed.';
  elsif v_order.order_status in ('completed', 'cancelled') then
    raise exception 'Order is already in a terminal state (%). No further transitions permitted.', v_order.order_status;
  end if;

  if p_new_status = 'cancelled' and v_order.order_status <> 'cancelled' then
    for v_item in select product_id, quantity from public.order_items where order_id = p_order_id loop
      update public.products
      set stock_quantity = stock_quantity + v_item.quantity, updated_at = now()
      where id = v_item.product_id;
    end loop;
  end if;

  update public.orders
  set order_status = p_new_status, updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;
