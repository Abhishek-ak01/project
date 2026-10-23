-- ============================================================================
-- LocalLoop Marketplace: Migration 002 - Row Level Security (RLS) & Access Control
-- Version: 20261023000002
-- Description: Enables RLS across all tables, defines helper functions, prevents
--              privilege escalation, and establishes strict role-based policies.
-- ============================================================================

-- ============================================================================
-- 1. SECURITY DEFINER HELPER FUNCTIONS (Avoid recursion in RLS policies)
-- ============================================================================

-- Check if current authenticated user is a verified administrator
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

-- Get the seller profile ID owned by the current user
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

-- Check if current user is an approved seller
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
-- 2. PRIVILEGE ESCALATION PREVENTION TRIGGERS
-- ============================================================================

-- Prevent users from updating their own role to 'admin' or changing other protected flags
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

create trigger tr_prevent_role_escalation
  before update of role on public.profiles
  for each row execute function public.prevent_profile_role_escalation();

-- Prevent sellers from approving their own storefront
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

create trigger tr_prevent_seller_self_approval
  before update of approval_status on public.seller_profiles
  for each row execute function public.prevent_seller_self_approval();

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.favorites enable row level security;

-- ============================================================================
-- 4. POLICIES: PROFILES
-- ============================================================================

-- Customers & Sellers can view their own profile; Admins can view all
create policy "Users can view their own profile or admins view all"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.is_admin()
  );

-- Users can update permitted fields of their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================================
-- 5. POLICIES: SELLER PROFILES
-- ============================================================================

-- Public can view approved sellers; Sellers can view their own; Admins view all
create policy "Public can view approved sellers"
  on public.seller_profiles for select
  using (
    approval_status = 'approved'
    or user_id = auth.uid()
    or public.is_admin()
  );

-- Users can register their own seller profile with pending status
create policy "Registered users can submit seller profile"
  on public.seller_profiles for insert
  with check (
    user_id = auth.uid()
    and (approval_status = 'pending' or public.is_admin())
  );

-- Sellers can update their own storefront info (approval status guarded by trigger)
create policy "Sellers can update their own storefront"
  on public.seller_profiles for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- 6. POLICIES: CATEGORIES
-- ============================================================================

-- Categories are publicly readable by everyone
create policy "Categories are publicly readable"
  on public.categories for select
  using (true);

-- Only admins can manage categories
create policy "Admins can manage categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 7. POLICIES: PRODUCTS
-- ============================================================================

-- Public can view active products from approved sellers; Sellers view all own; Admins view all
create policy "Public can view active products from approved sellers"
  on public.products for select
  using (
    (
      is_active = true
      and is_moderated = false
      and exists (
        select 1 from public.seller_profiles
        where public.seller_profiles.id = public.products.seller_id
        and public.seller_profiles.approval_status = 'approved'
      )
    )
    or seller_id = public.get_my_seller_id()
    or public.is_admin()
  );

-- Approved sellers can add products to their own store
create policy "Sellers can add products to own storefront"
  on public.products for insert
  with check (
    seller_id = public.get_my_seller_id()
    and public.is_approved_seller()
  );

-- Sellers can update their own products; Admins can update any
create policy "Sellers can update own products or admins manage all"
  on public.products for update
  using (seller_id = public.get_my_seller_id() or public.is_admin())
  with check (seller_id = public.get_my_seller_id() or public.is_admin());

-- Sellers can delete their own products; Admins can delete any
create policy "Sellers can delete own products or admins manage all"
  on public.products for delete
  using (seller_id = public.get_my_seller_id() or public.is_admin());

-- ============================================================================
-- 8. POLICIES: ADDRESSES
-- ============================================================================

create policy "Users manage their own saved addresses"
  on public.addresses for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ============================================================================
-- 9. POLICIES: ORDERS
-- ============================================================================

-- Customers view own orders; Sellers view orders for their storefront; Admins view all
create policy "Customers and sellers view their assigned orders"
  on public.orders for select
  using (
    customer_id = auth.uid()
    or seller_id = public.get_my_seller_id()
    or public.is_admin()
  );

-- Customers can create orders (typically invoked via atomic transaction function)
create policy "Customers can place orders"
  on public.orders for insert
  with check (customer_id = auth.uid());

-- Sellers can update orders for their business (status transitions enforced by trigger)
create policy "Sellers can update orders for their store"
  on public.orders for update
  using (seller_id = public.get_my_seller_id() or customer_id = auth.uid() or public.is_admin())
  with check (seller_id = public.get_my_seller_id() or customer_id = auth.uid() or public.is_admin());

-- ============================================================================
-- 10. POLICIES: ORDER ITEMS
-- ============================================================================

-- Customers and sellers can view order items for their permitted orders
create policy "Permitted users view relevant order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where public.orders.id = public.order_items.order_id
      and (
        public.orders.customer_id = auth.uid()
        or public.orders.seller_id = public.get_my_seller_id()
        or public.is_admin()
      )
    )
  );

-- ============================================================================
-- 11. POLICIES: FAVORITES
-- ============================================================================

create policy "Users manage their own favorites"
  on public.favorites for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
