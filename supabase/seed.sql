-- Nuede V2 deterministic local development seed.
-- These names, prices, fees, and testimonials are representative test data,
-- not production business rules or UI-mockup authority.

begin;

insert into public.categories (id, name, slug, is_enabled, sort_order)
values
  ('10000000-0000-4000-8000-000000000001', 'Main Meals', 'main-meals', true, 10),
  ('10000000-0000-4000-8000-000000000002', 'Sides', 'sides', true, 20),
  ('10000000-0000-4000-8000-000000000003', 'Grouped Meals', 'grouped-meals', true, 30);

insert into public.products (
  id,
  category_id,
  product_type,
  name,
  slug,
  description,
  price_kobo,
  calories,
  protein_g,
  carbohydrates_g,
  fat_g,
  image_path,
  status,
  requires_variant_selection,
  is_featured,
  sort_order
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'standard',
    'Grilled Citrus Chicken',
    'grilled-citrus-chicken',
    'Grilled chicken with citrus seasoning and a balanced grain accompaniment.',
    850000,
    610,
    48.00,
    62.00,
    18.00,
    'products/grilled-citrus-chicken.jpg',
    'available',
    false,
    true,
    10
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'standard',
    'Smoky Beef Rice Bowl',
    'smoky-beef-rice-bowl',
    'Slow-cooked beef served with seasoned rice.',
    920000,
    720,
    44.00,
    null,
    24.00,
    'products/smoky-beef-rice-bowl.jpg',
    'sold_out',
    false,
    false,
    20
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'standard',
    'Garden Vegetable Bowl',
    'garden-vegetable-bowl',
    'A plant-forward bowl prepared with seasonal vegetables.',
    650000,
    null,
    null,
    null,
    null,
    null,
    'available',
    false,
    false,
    30
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    'standard',
    'Coconut Fish Curry',
    'coconut-fish-curry',
    'Fish in a mild coconut curry with vegetables.',
    980000,
    680,
    46.00,
    54.00,
    null,
    'products/coconut-fish-curry.jpg',
    'hidden',
    false,
    false,
    40
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    'standard',
    'Chef Seasonal Plate',
    'chef-seasonal-plate',
    'A rotating seasonal plate awaiting its final selling price.',
    null,
    590,
    38.00,
    58.00,
    20.00,
    null,
    'price_pending',
    false,
    false,
    50
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000002',
    'standard',
    'Roasted Sweet Potato Wedges',
    'roasted-sweet-potato-wedges',
    'Oven-roasted sweet potato wedges with herbs.',
    250000,
    230,
    4.00,
    48.00,
    3.00,
    'products/roasted-sweet-potato-wedges.jpg',
    'available',
    false,
    false,
    10
  ),
  (
    '20000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000002',
    'standard',
    'Sauteed Seasonal Greens',
    'sauteed-seasonal-greens',
    'Lightly sauteed seasonal greens.',
    300000,
    140,
    null,
    18.00,
    6.00,
    null,
    'unavailable',
    false,
    false,
    20
  ),
  (
    '20000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000003',
    'grouped',
    'Peppered Chicken Bowl',
    'peppered-chicken-bowl',
    'Peppered chicken paired with a selectable base.',
    null,
    null,
    null,
    null,
    null,
    'products/peppered-chicken-bowl.jpg',
    'available',
    true,
    true,
    10
  );

insert into public.product_variants (
  id,
  product_id,
  name,
  description,
  price_kobo,
  calories,
  protein_g,
  carbohydrates_g,
  fat_g,
  image_path,
  status,
  sort_order
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000008',
    'Peppered Chicken + Rice',
    'Peppered chicken served with seasoned rice.',
    1050000,
    760,
    52.00,
    82.00,
    22.00,
    'products/peppered-chicken-rice.jpg',
    'available',
    10
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000008',
    'Peppered Chicken + Pasta',
    'Peppered chicken served with pasta.',
    1100000,
    810,
    50.00,
    null,
    25.00,
    'products/peppered-chicken-pasta.jpg',
    'sold_out',
    20
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000008',
    'Peppered Chicken + Potatoes',
    'Peppered chicken served with roasted potatoes.',
    null,
    null,
    null,
    null,
    null,
    null,
    'hidden',
    30
  );

update public.products
set
  requires_variant_selection = false,
  default_variant_id = '30000000-0000-4000-8000-000000000001'
where id = '20000000-0000-4000-8000-000000000008';

insert into public.product_addons (
  id,
  name,
  price_kobo,
  calories,
  protein_g,
  carbohydrates_g,
  fat_g,
  is_available
)
values
  ('40000000-0000-4000-8000-000000000001', 'Extra Chicken', 300000, 210, 32.00, 2.00, 8.00, true),
  ('40000000-0000-4000-8000-000000000002', 'Extra Rice', 150000, 190, 4.00, 42.00, 1.00, true),
  ('40000000-0000-4000-8000-000000000003', 'Extra Sauce', 80000, null, null, null, null, true),
  ('40000000-0000-4000-8000-000000000004', 'Extra Vegetables', 120000, 70, 3.00, 12.00, 2.00, false);

insert into public.product_addon_assignments (product_id, addon_id, sort_order)
values
  ('20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 10),
  ('20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', 20),
  ('20000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 10),
  ('20000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000001', 10),
  ('20000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000002', 20),
  ('20000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000003', 30),
  ('20000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000004', 40);

insert into public.delivery_zones (id, name, slug, fee_kobo, is_active, sort_order)
values
  ('50000000-0000-4000-8000-000000000001', 'Gwarimpa', 'gwarimpa', 180000, true, 10),
  ('50000000-0000-4000-8000-000000000002', 'Katampe', 'katampe', 180000, true, 20),
  ('50000000-0000-4000-8000-000000000003', 'Lifecamp', 'lifecamp', 160000, true, 30),
  ('50000000-0000-4000-8000-000000000004', 'Wuse', 'wuse', 150000, true, 40),
  ('50000000-0000-4000-8000-000000000005', 'Apo', 'apo', 190000, true, 50),
  ('50000000-0000-4000-8000-000000000006', 'Galadimawa', 'galadimawa', 200000, true, 60),
  ('50000000-0000-4000-8000-000000000007', 'Other', 'other', 250000, false, 70);

insert into public.testimonials (
  id,
  customer_name,
  message,
  rating,
  is_published,
  published_at
)
values
  (
    '60000000-0000-4000-8000-000000000001',
    'Development Customer A',
    'A representative local testimonial used to verify published storefront data.',
    5,
    true,
    now()
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    'Development Customer B',
    'A second representative record for rating and publication tests.',
    4,
    true,
    now()
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    'Development Customer C',
    'An unpublished development testimonial for admin-state verification.',
    4,
    false,
    null
  );

insert into public.checkout_settings (id, paystack_enabled, whatsapp_enabled, updated_by)
values (true, true, true, null);

commit;
