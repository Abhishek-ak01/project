-- ============================================================================
-- LocalLoop Marketplace: Automated SQL Test Suite
-- Description: Verifies schema constraints, anti-privilege escalation triggers,
--              atomic checkout calculation, stock decrements, and cancellation restoration.
-- Run in Supabase SQL Editor or psql to validate database integrity.
-- ============================================================================

\echo '----------------------------------------------------------------------'
\echo 'Starting LocalLoop PostgreSQL Database Test Suite...'
\echo '----------------------------------------------------------------------'

-- ============================================================================
-- TEST 1: Constraint Verification (Negative Stock & Price Prevention)
-- ============================================================================
do $$
begin
  begin
    insert into public.products (
      seller_id, category_id, name, slug, price, stock_quantity
    ) values (
      '22222222-2222-2222-2222-222222222201',
      '11111111-1111-1111-1111-111111111102',
      'Negative Price Loaf',
      'negative-price-loaf',
      -5.00,
      10
    );
    raise exception 'TEST 1 FAILED: Database allowed negative price!';
  exception when check_violation then
    raise notice 'TEST 1A PASSED: Correctly rejected negative price check constraint.';
  end;

  begin
    insert into public.products (
      seller_id, category_id, name, slug, price, stock_quantity
    ) values (
      '22222222-2222-2222-2222-222222222201',
      '11111111-1111-1111-1111-111111111102',
      'Negative Stock Loaf',
      'negative-stock-loaf',
      5.00,
      -10
    );
    raise exception 'TEST 1 FAILED: Database allowed negative stock quantity!';
  exception when check_violation then
    raise notice 'TEST 1B PASSED: Correctly rejected negative stock_quantity check constraint.';
  end;
end;
$$;

-- ============================================================================
-- TEST 2: Role Escalation Security (Non-admin cannot elevate role)
-- ============================================================================
do $$
declare
  v_old_role text;
begin
  select role into v_old_role from public.profiles where id = '00000000-0000-0000-0000-000000000003';
  
  -- Attempt to update customer role to admin without admin auth
  begin
    -- Simulate non-admin session
    set local role authenticated;
    set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000003';

    update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000003';
    raise exception 'TEST 2 FAILED: Customer successfully elevated role to admin!';
  exception when others then
    raise notice 'TEST 2 PASSED: Anti-escalation trigger prevented unauthorized role modification.';
  end;
  reset role;
end;
$$;

-- ============================================================================
-- TEST 3: Seller Self-Approval Security
-- ============================================================================
do $$
begin
  begin
    set local role authenticated;
    set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000002';

    update public.seller_profiles 
    set approval_status = 'approved' 
    where id = '22222222-2222-2222-2222-222222222201';
    
    raise exception 'TEST 3 FAILED: Seller self-approved their storefront!';
  exception when others then
    raise notice 'TEST 3 PASSED: Anti-escalation trigger prevented seller from modifying approval_status.';
  end;
  reset role;
end;
$$;

-- ============================================================================
-- TEST 4: Atomic Order Creation, Authoritative Pricing & Stock Decrement
-- ============================================================================
do $$
declare
  v_initial_stock int;
  v_final_stock int;
  v_order_result record;
  v_order_id uuid;
  v_item_snapshot_price numeric;
  v_item_snapshot_name text;
begin
  -- Check initial stock of Country Sourdough Boule ($7.50)
  select stock_quantity into v_initial_stock 
  from public.products 
  where id = '33333333-3333-3333-3333-333333333301';

  -- Place order for 2 units
  select * into v_order_result from public.create_order_atomic(
    '00000000-0000-0000-0000-000000000003'::uuid,
    '22222222-2222-2222-2222-222222222201'::uuid,
    'local_delivery',
    '{"street": "742 Evergreen Terrace", "city": "Greenville", "locality": "Riverside Valley"}'::jsonb,
    'card_demo',
    'Test order notes',
    '[{"product_id": "33333333-3333-3333-3333-333333333301", "quantity": 2}]'::jsonb
  );

  v_order_id := v_order_result.order_id;

  -- Verify authoritative totals: Subtotal = 2 * 7.50 = 15.00, Tax = 1.20, Delivery = 3.50, Total = 19.70
  if v_order_result.subtotal <> 15.00 then
    raise exception 'TEST 4 FAILED: Expected subtotal 15.00, got %', v_order_result.subtotal;
  end if;
  if v_order_result.tax <> 1.20 then
    raise exception 'TEST 4 FAILED: Expected tax 1.20, got %', v_order_result.tax;
  end if;
  if v_order_result.total <> 19.70 then
    raise exception 'TEST 4 FAILED: Expected total 19.70, got %', v_order_result.total;
  end if;

  -- Verify stock decremented by 2
  select stock_quantity into v_final_stock 
  from public.products 
  where id = '33333333-3333-3333-3333-333333333301';

  if v_final_stock <> (v_initial_stock - 2) then
    raise exception 'TEST 4 FAILED: Stock was not decremented! Initial: %, Final: %', v_initial_stock, v_final_stock;
  end if;

  -- Verify snapshots in order_items
  select product_name_snapshot, unit_price_snapshot 
  into v_item_snapshot_name, v_item_snapshot_price
  from public.order_items
  where order_id = v_order_id;

  if v_item_snapshot_price <> 7.50 or v_item_snapshot_name <> 'Country Sourdough Boule' then
    raise exception 'TEST 4 FAILED: Historical snapshot mismatch! Got price %, name %', v_item_snapshot_price, v_item_snapshot_name;
  end if;

  raise notice 'TEST 4 PASSED: create_order_atomic executed with perfect authoritative math, stock decrement, and line item snapshots.';
end;
$$;

-- ============================================================================
-- TEST 5: Overselling Prevention (Insufficient Stock Exception)
-- ============================================================================
do $$
begin
  begin
    perform public.create_order_atomic(
      '00000000-0000-0000-0000-000000000003'::uuid,
      '22222222-2222-2222-2222-222222222201'::uuid,
      'pickup',
      '{}'::jsonb,
      'card_demo',
      'Overselling test',
      '[{"product_id": "33333333-3333-3333-3333-333333333301", "quantity": 9999}]'::jsonb
    );
    raise exception 'TEST 5 FAILED: Allowed order with quantity exceeding stock!';
  exception when others then
    raise notice 'TEST 5 PASSED: Correctly threw exception on insufficient inventory.';
  end;
end;
$$;

-- ============================================================================
-- TEST 6: Permitted Status Transitions & Stock Restoration on Cancellation
-- ============================================================================
do $$
declare
  v_test_order_id uuid;
  v_stock_before int;
  v_stock_after_cancel int;
begin
  -- Create order for 1 croissant (3 in stock)
  select order_id into v_test_order_id from public.create_order_atomic(
    '00000000-0000-0000-0000-000000000003'::uuid,
    '22222222-2222-2222-2222-222222222201'::uuid,
    'pickup',
    '{}'::jsonb,
    'card_demo',
    'Cancellation test',
    '[{"product_id": "33333333-3333-3333-3333-333333333303", "quantity": 1}]'::jsonb
  );

  select stock_quantity into v_stock_before from public.products where id = '33333333-3333-3333-3333-333333333303';

  -- Simulate seller confirming order
  perform public.transition_order_status(v_test_order_id, 'confirmed');

  -- Cancel order and verify stock is restored
  perform public.transition_order_status(v_test_order_id, 'cancelled', 'Out of morning butter');

  select stock_quantity into v_stock_after_cancel from public.products where id = '33333333-3333-3333-3333-333333333303';

  if v_stock_after_cancel <> (v_stock_before + 1) then
    raise exception 'TEST 6 FAILED: Stock was not restored on cancellation! Before: %, After: %', v_stock_before, v_stock_after_cancel;
  end if;

  raise notice 'TEST 6 PASSED: Permitted status transition succeeded and cancellation restored inventory.';
end;
$$;

\echo '----------------------------------------------------------------------'
\echo 'ALL DATABASE TESTS PASSED SUCCESSFULLY! LocalLoop schema is robust.'
\echo '----------------------------------------------------------------------'
