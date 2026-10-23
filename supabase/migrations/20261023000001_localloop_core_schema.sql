-- ============================================================================
-- LocalLoop Marketplace: Migration 001 - Core Schema & Constraints
-- Version: 20261023000001
-- Description: Creates extension, core tables, domain types, constraints, and indexes.
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

comment on table public.profiles is 'User profile extending auth.users with marketplace role and contact details';

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

comment on table public.seller_profiles is 'Authorized business storefronts for neighborhood makers and small enterprises';

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

comment on table public.categories is 'Catalog categories for sorting fresh harvest, bakery, and local artisan goods';

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

comment on table public.products is 'Available inventory items tracked with non-negative constraints and fixed precision';

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
  locality text not null, -- Neighborhood
  postal_code text not null,
  delivery_instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.addresses is 'Saved delivery addresses and neighborhood drop-off notes for customers';

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

comment on table public.orders is 'Authoritative customer orders with immutable totals and fulfillment state tracking';

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

comment on table public.order_items is 'Line items preserving product name and price snapshots for audit accuracy';

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

comment on table public.favorites is 'Saved wishlist items per shopper';

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
-- 10. SYSTEM TRIGGERS: auto-update updated_at timestamp
-- ============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger tr_seller_profiles_updated_at
  before update on public.seller_profiles
  for each row execute function public.handle_updated_at();

create trigger tr_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

create trigger tr_orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();
