-- Import the September 2026 Nuede menu and preserve the decimal calorie values
-- supplied by the business. Prices and descriptions were not present in the
-- source document, so newly created products remain visible as price-pending.

alter table public.products
  alter column calories type numeric(10, 2) using calories::numeric;
alter table public.product_variants
  alter column calories type numeric(10, 2) using calories::numeric;
alter table public.product_addons
  alter column calories type numeric(10, 2) using calories::numeric;
alter table public.orders
  alter column total_calories type numeric(10, 2) using total_calories::numeric;
alter table public.order_items
  alter column calories type numeric(10, 2) using calories::numeric;
alter table public.order_item_addons
  alter column calories type numeric(10, 2) using calories::numeric;

-- A fresh local reset runs migrations before seed.sql, while an existing
-- deployment already has these categories. Upserting by slug supports both.
insert into public.categories (id, name, slug, is_enabled, sort_order)
values
  ('10000000-0000-4000-8000-000000000001', 'Main Meals', 'main-meals', true, 10),
  ('10000000-0000-4000-8000-000000000002', 'Sides', 'sides', true, 20)
on conflict (slug) do update set
  name = excluded.name,
  is_enabled = true,
  sort_order = excluded.sort_order;

with menu_items (
  id, category_slug, name, slug, calories, protein_g, carbohydrates_g, fat_g, sort_order
) as (
  values
    ('80000000-0000-4000-8000-000000000001'::uuid, 'main-meals', 'Peppered Sesame Chicken', 'peppered-sesame-chicken', 1089.7, 50.8, 18.0, 90.5, 100),
    ('80000000-0000-4000-8000-000000000002'::uuid, 'main-meals', 'Peppered Chicken & Veg Stir Fry', 'peppered-chicken-veg-stir-fry', 1154.6, 51.8, 18.6, 97.0, 110),
    ('80000000-0000-4000-8000-000000000003'::uuid, 'sides', 'Grilled Corn', 'grilled-corn', null, null, null, null, 100),
    ('80000000-0000-4000-8000-000000000004'::uuid, 'main-meals', 'Oven-roasted Chicken and Potatoes', 'oven-roasted-chicken-and-potatoes', 960.5, 40.3, 110.5, 39.7, 120),
    ('80000000-0000-4000-8000-000000000005'::uuid, 'sides', 'Chicken Salad Bowl', 'chicken-salad-bowl', 84.2, 9.8, 9.0, 1.0, 110),
    ('80000000-0000-4000-8000-000000000006'::uuid, 'sides', 'Egg Salad Bowl', 'egg-salad-bowl', 55.4, 5.0, 0.3, 3.8, 120),
    ('80000000-0000-4000-8000-000000000007'::uuid, 'main-meals', 'Vegetarian Salad Bowl', 'vegetarian-salad-bowl', null, null, null, null, 130),
    ('80000000-0000-4000-8000-000000000008'::uuid, 'main-meals', 'Green Cream Pasta', 'green-cream-pasta', null, null, null, null, 140),
    ('80000000-0000-4000-8000-000000000009'::uuid, 'main-meals', 'Alfredo Pasta', 'alfredo-pasta', 1268.5, 61.6, 139.2, 51.7, 150),
    ('80000000-0000-4000-8000-000000000010'::uuid, 'main-meals', 'Stir-fry Spaghetti', 'stir-fry-spaghetti', 1250.2, 43.2, 142.0, 56.6, 160),
    ('80000000-0000-4000-8000-000000000011'::uuid, 'sides', 'Chicken Egg Wrap', 'chicken-egg-wrap', 84.2, 9.8, 9.0, 1.0, 130),
    ('80000000-0000-4000-8000-000000000012'::uuid, 'sides', 'Beef Egg Wrap', 'beef-egg-wrap', 90.7, 9.4, 9.0, 1.9, 140),
    ('80000000-0000-4000-8000-000000000013'::uuid, 'main-meals', 'Egg Wrap', 'egg-wrap', 459.1, 27.0, 44.8, 19.1, 170),
    ('80000000-0000-4000-8000-000000000014'::uuid, 'main-meals', 'White Basmati Rice', 'white-basmati-rice', 348.5, 8.0, 78.0, 0.5, 180),
    ('80000000-0000-4000-8000-000000000015'::uuid, 'main-meals', 'Lemon Garlic Herb Rice', 'lemon-garlic-herb-rice', 664.5, 9.1, 83.0, 32.9, 190),
    ('80000000-0000-4000-8000-000000000016'::uuid, 'sides', 'Creamy Chicken', 'creamy-chicken', 1005.5, 102.9, 16.4, 58.7, 150),
    ('80000000-0000-4000-8000-000000000017'::uuid, 'sides', 'Mixed Veggies', 'mixed-veggies', 63.6, 2.9, 13.0, 0.0, 160),
    ('80000000-0000-4000-8000-000000000018'::uuid, 'sides', 'Beef Curry', 'beef-curry', 741.7, 4.1, 21.8, 70.9, 170),
    ('80000000-0000-4000-8000-000000000019'::uuid, 'main-meals', 'Oats', 'oats', 681.5, 23.5, 91.3, 24.7, 200),
    ('80000000-0000-4000-8000-000000000020'::uuid, 'main-meals', 'Classic Chia Pudding', 'classic-chia-pudding', null, null, null, null, 210),
    ('80000000-0000-4000-8000-000000000021'::uuid, 'main-meals', 'Autumn Spice Chia Pudding', 'autumn-spice-chia-pudding', null, null, null, null, 220),
    ('80000000-0000-4000-8000-000000000022'::uuid, 'main-meals', 'Berry Delight Chia Pudding', 'berry-delight-chia-pudding', null, null, null, null, 230),
    ('80000000-0000-4000-8000-000000000023'::uuid, 'main-meals', 'Banana Protein Shake', 'banana-protein-shake', null, null, null, null, 240),
    ('80000000-0000-4000-8000-000000000024'::uuid, 'main-meals', 'Strawberry Protein Shake', 'strawberry-protein-shake', null, null, null, null, 250),
    ('80000000-0000-4000-8000-000000000025'::uuid, 'main-meals', 'Orange Juice', 'orange-juice', 228.6, 3.5, 51.4, 1.0, 260),
    ('80000000-0000-4000-8000-000000000026'::uuid, 'main-meals', 'Pineapple Juice', 'pineapple-juice', 266.9, 2.0, 63.6, 0.5, 270),
    ('80000000-0000-4000-8000-000000000027'::uuid, 'main-meals', 'Watermelon Juice', 'watermelon-juice', 166.6, 2.0, 37.4, 1.0, 280),
    ('80000000-0000-4000-8000-000000000028'::uuid, 'main-meals', 'Pancakes Only', 'pancakes-only', 1502.7, 47.9, 264.1, 28.3, 290),
    ('80000000-0000-4000-8000-000000000029'::uuid, 'sides', 'Sausages', 'sausages', 71.8, 6.3, 0.4, 5.0, 180),
    ('80000000-0000-4000-8000-000000000030'::uuid, 'sides', 'Eggs', 'eggs', 85.2, 4.5, 0.6, 7.2, 190),
    ('80000000-0000-4000-8000-000000000031'::uuid, 'sides', 'Banana', 'banana', null, null, null, null, 200),
    ('80000000-0000-4000-8000-000000000032'::uuid, 'sides', 'Apples', 'apples', null, null, null, null, 210),
    ('80000000-0000-4000-8000-000000000033'::uuid, 'sides', 'Strawberry', 'strawberry', null, null, null, null, 220)
)
insert into public.products (
  id, category_id, product_type, name, slug, description, price_kobo,
  calories, protein_g, carbohydrates_g, fat_g, image_path, status,
  requires_variant_selection, is_featured, sort_order
)
select
  menu_item.id, category.id, 'standard', menu_item.name, menu_item.slug, '',
  null, menu_item.calories, menu_item.protein_g, menu_item.carbohydrates_g,
  menu_item.fat_g, null, 'price_pending', false, false, menu_item.sort_order
from menu_items as menu_item
join public.categories as category on category.slug = menu_item.category_slug
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  calories = excluded.calories,
  protein_g = excluded.protein_g,
  carbohydrates_g = excluded.carbohydrates_g,
  fat_g = excluded.fat_g,
  sort_order = excluded.sort_order;

-- Keep decimal calories intact when authoritative orders are snapshotted.
create or replace function public.create_order_atomic(p_order jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_order_id uuid := gen_random_uuid();
  created_reference text := 'NUE-' || lpad(nextval('private.order_reference_sequence'::regclass)::text, 6, '0');
  created_at_value timestamptz;
  item jsonb;
  addon jsonb;
  created_item_id uuid;
begin
  if jsonb_typeof(p_order) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'Order payload must be an object.';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Order items must be a non-empty array.';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'Order items must be a non-empty array.';
  end if;

  insert into public.orders (
    id, order_reference, order_type, customer_name, customer_phone,
    customer_email, delivery_address, delivery_landmark, delivery_zone_id,
    delivery_zone_name, payment_method, payment_status, fulfilment_status,
    subtotal_kobo, delivery_fee_kobo, total_kobo, total_calories,
    total_protein_g, total_carbohydrates_g, total_fat_g,
    nutrition_completeness, meal_plan_start_date, meal_plan_end_date
  ) values (
    created_order_id, created_reference, p_order ->> 'order_type',
    p_order ->> 'customer_name', p_order ->> 'customer_phone',
    nullif(p_order ->> 'customer_email', ''), p_order ->> 'delivery_address',
    nullif(p_order ->> 'delivery_landmark', ''),
    nullif(p_order ->> 'delivery_zone_id', '')::uuid,
    p_order ->> 'delivery_zone_name', p_order ->> 'payment_method',
    'unpaid', 'pending', (p_order ->> 'subtotal_kobo')::bigint,
    (p_order ->> 'delivery_fee_kobo')::bigint,
    (p_order ->> 'total_kobo')::bigint,
    (p_order ->> 'total_calories')::numeric,
    (p_order ->> 'total_protein_g')::numeric,
    (p_order ->> 'total_carbohydrates_g')::numeric,
    (p_order ->> 'total_fat_g')::numeric,
    p_order ->> 'nutrition_completeness',
    (p_order ->> 'meal_plan_start_date')::date,
    (p_order ->> 'meal_plan_end_date')::date
  ) returning created_at into created_at_value;

  for item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      order_id, product_id, variant_id, product_name, variant_name,
      unit_base_price_kobo, quantity, line_total_kobo, calories, protein_g,
      carbohydrates_g, fat_g, scheduled_for, meal_slot
    ) values (
      created_order_id, nullif(item ->> 'product_id', '')::uuid,
      nullif(item ->> 'variant_id', '')::uuid, item ->> 'product_name',
      nullif(item ->> 'variant_name', ''),
      (item ->> 'unit_base_price_kobo')::bigint,
      (item ->> 'quantity')::integer, (item ->> 'line_total_kobo')::bigint,
      (item ->> 'calories')::numeric, (item ->> 'protein_g')::numeric,
      (item ->> 'carbohydrates_g')::numeric, (item ->> 'fat_g')::numeric,
      (item ->> 'scheduled_for')::date, nullif(item ->> 'meal_slot', '')
    ) returning id into created_item_id;

    if item ? 'addons' and jsonb_typeof(item -> 'addons') is distinct from 'array' then
      raise exception using errcode = '22023', message = 'Order item add-ons must be an array.';
    end if;

    for addon in select value from jsonb_array_elements(coalesce(item -> 'addons', '[]'::jsonb))
    loop
      insert into public.order_item_addons (
        order_item_id, addon_id, addon_name, unit_price_kobo, calories,
        protein_g, carbohydrates_g, fat_g
      ) values (
        created_item_id, nullif(addon ->> 'addon_id', '')::uuid,
        addon ->> 'addon_name', (addon ->> 'unit_price_kobo')::bigint,
        (addon ->> 'calories')::numeric, (addon ->> 'protein_g')::numeric,
        (addon ->> 'carbohydrates_g')::numeric, (addon ->> 'fat_g')::numeric
      );
    end loop;
  end loop;

  return jsonb_build_object(
    'order_id', created_order_id,
    'order_reference', created_reference,
    'created_at', created_at_value,
    'payment_status', 'unpaid',
    'fulfilment_status', 'pending'
  );
end;
$$;

alter function public.create_order_atomic(jsonb, jsonb) owner to postgres;
revoke all on function public.create_order_atomic(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order_atomic(jsonb, jsonb) to service_role;

comment on function public.create_order_atomic(jsonb, jsonb) is
  'Persists one already validated server-authoritative order and all child snapshots atomically; callable only by the backend service role.';
