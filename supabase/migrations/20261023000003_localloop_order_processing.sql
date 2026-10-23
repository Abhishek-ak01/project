-- ============================================================================
-- LocalLoop Marketplace: Migration 003 - Atomic Order Processing & Inventory Functions
-- Version: 20261023000003
-- Description: Creates trusted PostgreSQL stored procedures for atomic checkout,
--              concurrency-safe row locking, authoritative pricing, and status transitions.
-- ============================================================================

-- ============================================================================
-- 1. ATOMIC CHECKOUT & INVENTORY DEDUCTION PROCEDURE
-- ============================================================================
create or replace function public.create_order_atomic(
  p_customer_id uuid,
  p_seller_id uuid,
  p_delivery_type text,
  p_shipping_details jsonb,
  p_payment_method text,
  p_customer_notes text,
  p_items jsonb -- json array of { product_id: uuid, quantity: int }
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
  -- Validate caller permissions
  if auth.uid() is not null and auth.uid() <> p_customer_id and not public.is_admin() then
    raise exception 'Unauthorized: You cannot place orders on behalf of another customer.';
  end if;

  -- Validate seller is approved
  select approval_status into v_seller_status
  from public.seller_profiles
  where id = p_seller_id;

  if v_seller_status is null or v_seller_status <> 'approved' then
    raise exception 'Cannot create order: The selected seller storefront is not currently active and approved.';
  end if;

  -- Validate items array is non-empty
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty: At least one product is required to place an order.';
  end if;

  -- 1. Row Locking & Concurrency Verification
  -- Lock products in a consistent order (by id) to avoid deadlocks across concurrent shoppers
  for v_item in 
    select value from jsonb_array_elements(p_items) 
    order by (value->>'product_id')::uuid 
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity % for product %: Quantity must be greater than zero.', v_qty, v_product_id;
    end if;

    -- SELECT ... FOR UPDATE locks the product row against concurrent updates
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

    -- Authoritative subtotal calculation based solely on database prices
    v_line_total := round(v_prod.price * v_qty, 2);
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  -- 2. Authoritative Tax & Delivery Fee Rules
  v_tax := round(v_subtotal * 0.08, 2); -- Standard 8% local sales tax
  if p_delivery_type = 'pickup' or v_subtotal >= 35.00 then
    v_delivery_fee := 0.00; -- Free pickup or free delivery over $35
  else
    v_delivery_fee := 3.50; -- Flat neighborhood delivery courier fee
  end if;
  v_total := v_subtotal + v_tax + v_delivery_fee;

  -- Generate human-friendly order number (e.g. LL-82914)
  v_order_number := 'LL-' || lpad(floor(random() * 90000 + 10000)::text, 5, '0');

  -- 3. Insert Parent Order Record
  insert into public.orders (
    customer_id,
    seller_id,
    order_number,
    shipping_details,
    delivery_type,
    subtotal,
    tax,
    delivery_fee,
    total,
    order_status,
    payment_status,
    payment_method,
    customer_notes
  ) values (
    p_customer_id,
    p_seller_id,
    v_order_number,
    p_shipping_details,
    p_delivery_type,
    v_subtotal,
    v_tax,
    v_delivery_fee,
    v_total,
    'placed',
    'simulated_paid',
    coalesce(p_payment_method, 'card_demo'),
    p_customer_notes
  ) returning id into v_order_id;

  -- 4. Deduct Inventory & Insert Line Items with Historical Snapshots
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;

    select id, name, price into v_prod
    from public.products
    where id = v_product_id;

    v_line_total := round(v_prod.price * v_qty, 2);

    -- Atomic stock reduction
    update public.products
    set stock_quantity = stock_quantity - v_qty,
        updated_at = now()
    where id = v_product_id;

    -- Historical item snapshot
    insert into public.order_items (
      order_id,
      product_id,
      seller_id,
      product_name_snapshot,
      unit_price_snapshot,
      quantity,
      line_total
    ) values (
      v_order_id,
      v_product_id,
      p_seller_id,
      v_prod.name,
      v_prod.price,
      v_qty,
      v_line_total
    );
  end loop;

  return query select v_order_id, v_order_number, v_subtotal, v_tax, v_delivery_fee, v_total;
end;
$$;

comment on function public.create_order_atomic is 'Locks inventory rows, calculates authoritative prices, decrements stock, and creates order records atomically.';

-- ============================================================================
-- 2. PERMITTED SELLER STATUS TRANSITIONS & STOCK RESTORATION
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

  -- Verify caller is authorized seller or admin
  if v_order.seller_id <> v_my_seller_id and not public.is_admin() then
    -- Allow customer to cancel only if status is placed
    if v_order.customer_id = auth.uid() and p_new_status = 'cancelled' and v_order.order_status = 'placed' then
      -- Authorized customer cancellation
    else
      raise exception 'Unauthorized to transition order status.';
    end if;
  end if;

  -- Validate transition rules
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

  -- If status is being cancelled, restore inventory
  if p_new_status = 'cancelled' and v_order.order_status <> 'cancelled' then
    for v_item in select product_id, quantity from public.order_items where order_id = p_order_id loop
      update public.products
      set stock_quantity = stock_quantity + v_item.quantity,
          updated_at = now()
      where id = v_item.product_id;
    end loop;
  end if;

  update public.orders
  set order_status = p_new_status,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

comment on function public.transition_order_status is 'Validates permitted status steps and automatically restores inventory if order is cancelled.';
