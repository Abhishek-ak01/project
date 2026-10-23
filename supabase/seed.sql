-- ============================================================================
-- LocalLoop Marketplace: Seed Dataset (Demo Data)
-- Description: Clearly labelled demo data with sample categories, sellers,
--              products, addresses, and favorites.
-- ============================================================================

-- Wrap in a transaction
begin;

-- ============================================================================
-- 1. DEMO AUTH USERS & PROFILES
-- ============================================================================
-- In Supabase, if auth.users exists, we insert demo accounts with hashed passwords
-- Password for all demo accounts: 'password123'
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  -- Admin: Sarah Jenkins
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'admin@localloop.local', crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Jenkins"}', now(), now()),

  -- Seller: Marcus Vance (Crust & Crumb Bakery)
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'marcus@crustandcrumb.local', crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Vance"}', now(), now()),

  -- Customer: Elena Rostova
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'elena@example.com', crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Elena Rostova"}', now(), now()),

  -- Seller 2: Claire Beauchamp (Rivora Urban Orchard)
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'claire@rivoraorchard.local', crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Claire Beauchamp"}', now(), now())
on conflict (id) do nothing;

-- Profiles corresponding to auth.users
insert into public.profiles (id, full_name, role, phone, neighborhood, avatar_url)
values
  ('00000000-0000-0000-0000-000000000001', 'Sarah Jenkins', 'admin', '(555) 999-0011', 'Greenville Downtown', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'),
  ('00000000-0000-0000-0000-000000000002', 'Marcus Vance', 'seller', '(555) 234-8901', 'Eastside Mill District', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'),
  ('00000000-0000-0000-0000-000000000003', 'Elena Rostova', 'customer', '(555) 321-7654', 'Riverside Valley', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'),
  ('00000000-0000-0000-0000-000000000004', 'Claire Beauchamp', 'seller', '(555) 345-6712', 'Riverside Valley', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80')
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  phone = excluded.phone,
  neighborhood = excluded.neighborhood;

-- ============================================================================
-- 2. CATEGORIES
-- ============================================================================
insert into public.categories (id, name, slug, icon, description, sort_order)
values
  ('11111111-1111-1111-1111-111111111101', 'Fresh Produce', 'produce', 'Apple', 'Hand-picked organic fruits and vegetables harvested this morning', 1),
  ('11111111-1111-1111-1111-111111111102', 'Artisan Bakery', 'bakery', 'Wheat', 'Naturally leavened sourdough, rustic baguettes, and fresh pastries', 2),
  ('11111111-1111-1111-1111-111111111103', 'Dairy & Farm Eggs', 'dairy', 'Milk', 'Pasture-raised eggs, farm fresh milk, and small-batch artisan cheeses', 3),
  ('11111111-1111-1111-1111-111111111104', 'Pantry & Raw Honey', 'pantry', 'Jar', 'Pure raw honey, cold-pressed olive oils, and small-batch preserves', 4),
  ('11111111-1111-1111-1111-111111111105', 'Craft Beverages', 'beverages', 'Coffee', 'Micro-roastery coffee beans, organic kombucha, and herbal infusions', 5),
  ('11111111-1111-1111-1111-111111111106', 'Handmade Goods', 'crafts', 'Sparkles', 'Locally made beeswax candles, herbal salves, and ceramic wares', 6)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug;

-- ============================================================================
-- 3. SELLER PROFILES
-- ============================================================================
insert into public.seller_profiles (
  id, user_id, business_name, slug, description, business_category, city, locality,
  contact_email, contact_phone, approval_status, rating, review_count,
  banner_url, logo_url, badges, delivery_available, pickup_available
) values
  -- Crust & Crumb Bakery
  ('22222222-2222-2222-2222-222222222201',
   '00000000-0000-0000-0000-000000000002',
   'Crust & Crumb Bakery',
   'crust-and-crumb',
   'Family-owned micro-bakery specializing in slow-fermented organic sourdough and heritage grains.',
   'Artisan Sourdough & Hearth Bakery',
   'Greenville',
   'Eastside Mill District',
   'marcus@crustandcrumb.local',
   '(555) 234-8901',
   'approved',
   4.95,
   128,
   'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
   array['Heritage Grains', 'Wood-Fired', 'Family Owned'],
   true,
   true),

  -- Rivora Urban Orchard
  ('22222222-2222-2222-2222-222222222202',
   '00000000-0000-0000-0000-000000000004',
   'Rivora Urban Orchard',
   'rivora-orchard',
   'Bio-intensive urban plots harvesting nutrient-dense seasonal produce within 12 hours of delivery.',
   'Organic Fruits & Vegetables',
   'Greenville',
   'Riverside Valley',
   'claire@rivoraorchard.local',
   '(555) 345-6712',
   'approved',
   4.92,
   215,
   'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=300&q=80',
   array['Certified Organic', 'Zero Pesticides', 'Harvested Daily'],
   true,
   true)
on conflict (id) do update set
  business_name = excluded.business_name,
  approval_status = excluded.approval_status;

-- ============================================================================
-- 4. PRODUCTS
-- ============================================================================
insert into public.products (
  id, seller_id, category_id, name, slug, description, price, compare_at_price,
  stock_quantity, unit, image_url, images, is_active, is_organic, is_featured,
  dietary, shelf_life
) values
  -- Sourdough Boule
  ('33333333-3333-3333-3333-333333333301',
   '22222222-2222-2222-2222-222222222201',
   '11111111-1111-1111-1111-111111111102',
   'Country Sourdough Boule',
   'country-sourdough-boule',
   'Signature hearth-baked sourdough loaf with caramelized crust and 36-hour wild cold ferment.',
   7.50,
   9.00,
   14,
   '850g loaf',
   'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80',
   array['https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80'],
   true,
   true,
   true,
   array['Vegan', 'Naturally Leavened'],
   '3-4 days at room temp'),

  -- Seeded Rye Batard
  ('33333333-3333-3333-3333-333333333302',
   '22222222-2222-2222-2222-222222222201',
   '11111111-1111-1111-1111-111111111102',
   'Seeded Rye & Spelt Batard',
   'seeded-rye-spelt-batard',
   'Dense, aromatic rustic batard loaded with toasted pumpkin seeds and golden flax.',
   8.25,
   9.50,
   6,
   '750g batard',
   'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
   array['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'],
   true,
   true,
   false,
   array['Vegan', 'Ancient Grains'],
   '5 days'),

  -- Normandy Butter Croissants (Low Stock Test)
  ('33333333-3333-3333-3333-333333333303',
   '22222222-2222-2222-2222-222222222201',
   '11111111-1111-1111-1111-111111111102',
   'Flaky Normandy Butter Croissants (4-Pack)',
   'normandy-butter-croissants-4pack',
   'Multi-layered hand-rolled croissants laminated with 84% butterfat European butter.',
   14.00,
   16.00,
   3,
   'Box of 4',
   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
   array['https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80'],
   true,
   false,
   true,
   array['Vegetarian'],
   'Best same day'),

  -- Heirloom Tomatoes
  ('33333333-3333-3333-3333-333333333304',
   '22222222-2222-2222-2222-222222222202',
   '11111111-1111-1111-1111-111111111101',
   'Heirloom Rainbow Tomatoes',
   'heirloom-rainbow-tomatoes',
   'Vibrant Cherokee Purple and Green Zebra tomatoes picked ripe from the vine this morning.',
   6.80,
   8.00,
   22,
   '1 kg basket',
   'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
   array['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80'],
   true,
   true,
   true,
   array['Organic', 'Raw', 'Vegan'],
   '5-7 days at room temp'),

  -- Tuscan Kale & Spinach
  ('33333333-3333-3333-3333-333333333305',
   '22222222-2222-2222-2222-222222222202',
   '11111111-1111-1111-1111-111111111101',
   'Crisp Tuscan Kale & Baby Spinach Mix',
   'tuscan-kale-baby-spinach-mix',
   'Tender baby Lacinato kale leaves with sweet baby spinach. Triple washed in spring water.',
   4.50,
   5.25,
   18,
   '300g clamshell',
   'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
   array['https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80'],
   true,
   true,
   false,
   array['Organic', 'Raw', 'Vegan'],
   '6-8 days refrigerated')
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  stock_quantity = excluded.stock_quantity;

-- ============================================================================
-- 5. SAVED CUSTOMER ADDRESS
-- ============================================================================
insert into public.addresses (
  id, user_id, recipient_name, phone, street_address, city, locality, postal_code, delivery_instructions, is_default
) values (
  '44444444-4444-4444-4444-444444444401',
  '00000000-0000-0000-0000-000000000003',
  'Elena Rostova',
  '(555) 321-7654',
  '742 Evergreen Terrace',
  'Greenville',
  'Riverside Valley',
  '97401',
  'Please leave on the front porch wicker bench',
  true
) on conflict (id) do nothing;

-- ============================================================================
-- 6. CUSTOMER FAVORITES
-- ============================================================================
insert into public.favorites (user_id, product_id)
values
  ('00000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333301'),
  ('00000000-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333304')
on conflict (user_id, product_id) do nothing;

commit;
