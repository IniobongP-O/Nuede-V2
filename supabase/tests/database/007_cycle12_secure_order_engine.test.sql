begin;

select plan(17);

select has_sequence('private', 'order_reference_sequence', 'order references use a private database sequence');
select has_function('public', 'create_order_atomic', array['jsonb', 'jsonb'], 'atomic order persistence RPC exists');
select function_returns('public', 'create_order_atomic', array['jsonb', 'jsonb'], 'jsonb', 'atomic order RPC returns a server result');
select ok(not has_function_privilege('anon', 'public.create_order_atomic(jsonb,jsonb)', 'EXECUTE'), 'anon cannot invoke atomic persistence directly');
select ok(not has_function_privilege('authenticated', 'public.create_order_atomic(jsonb,jsonb)', 'EXECUTE'), 'authenticated clients cannot invoke atomic persistence directly');
select ok(has_function_privilege('service_role', 'public.create_order_atomic(jsonb,jsonb)', 'EXECUTE'), 'service role can invoke atomic persistence');
select ok(not has_table_privilege('anon', 'public.orders', 'INSERT'), 'anon cannot insert orders directly');
select ok(not has_table_privilege('anon', 'public.order_items', 'INSERT'), 'anon cannot insert order items directly');
select ok(not has_table_privilege('anon', 'public.order_item_addons', 'INSERT'), 'anon cannot insert add-on snapshots directly');
select ok(not has_table_privilege('anon', 'public.payments', 'UPDATE'), 'anon cannot manipulate payment status');

select lives_ok(
  $$
    select public.create_order_atomic(
      '{
        "order_type":"cart",
        "customer_name":"Cycle 12 Snapshot",
        "customer_phone":"08000000000",
        "customer_email":null,
        "delivery_address":"14 Quiet Street, Abuja",
        "delivery_landmark":null,
        "delivery_zone_id":"50000000-0000-4000-8000-000000000001",
        "delivery_zone_name":"Central",
        "payment_method":"paystack",
        "subtotal_kobo":1800000,
        "delivery_fee_kobo":200000,
        "total_kobo":2000000,
        "total_calories":1400,
        "total_protein_g":100,
        "total_carbohydrates_g":90,
        "total_fat_g":34,
        "nutrition_completeness":"complete",
        "meal_plan_start_date":null,
        "meal_plan_end_date":null
      }'::jsonb,
      '[{
        "product_id":"20000000-0000-4000-8000-000000000001",
        "variant_id":null,
        "product_name":"Meal A",
        "variant_name":null,
        "unit_base_price_kobo":800000,
        "quantity":2,
        "line_total_kobo":1800000,
        "calories":1400,
        "protein_g":100,
        "carbohydrates_g":90,
        "fat_g":34,
        "scheduled_for":null,
        "meal_slot":null,
        "addons":[{
          "addon_id":"40000000-0000-4000-8000-000000000001",
          "addon_name":"Extra Chicken",
          "unit_price_kobo":100000,
          "calories":200,
          "protein_g":20,
          "carbohydrates_g":0,
          "fat_g":5
        }]
      }]'::jsonb
    )
  $$,
  'atomic RPC persists a complete order graph'
);

select is(
  (select total_kobo from public.orders where customer_name = 'Cycle 12 Snapshot'),
  2000000::bigint,
  'the permanent order stores authoritative integer-kobo totals'
);

update public.products
set name = 'Meal A Updated', price_kobo = 1000000
where id = '20000000-0000-4000-8000-000000000001';

update public.product_addons
set name = 'Extra Chicken Updated', price_kobo = 250000
where id = '40000000-0000-4000-8000-000000000001';

select is(
  (
    select concat(order_item.product_name, '|', order_item.unit_base_price_kobo, '|', addon.addon_name, '|', addon.unit_price_kobo)
    from public.order_items as order_item
    join public.orders as customer_order on customer_order.id = order_item.order_id
    join public.order_item_addons as addon on addon.order_item_id = order_item.id
    where customer_order.customer_name = 'Cycle 12 Snapshot'
  ),
  'Meal A|800000|Extra Chicken|100000',
  'product and add-on purchase-time snapshots are stored independently of live catalog values'
);

select lives_ok(
  $$
    select public.create_order_atomic(
      '{
        "order_type":"cart",
        "customer_name":"Cycle 12 Reference Two",
        "customer_phone":"08000000001",
        "delivery_address":"15 Quiet Street, Abuja",
        "delivery_zone_name":"Central",
        "payment_method":"whatsapp",
        "subtotal_kobo":500000,
        "delivery_fee_kobo":200000,
        "total_kobo":700000,
        "nutrition_completeness":"unavailable"
      }'::jsonb,
      '[{
        "product_name":"Reference Test Meal",
        "unit_base_price_kobo":500000,
        "quantity":1,
        "line_total_kobo":500000,
        "addons":[]
      }]'::jsonb
    )
  $$,
  'a second order receives another server-generated reference'
);

select is(
  (
    select count(distinct order_reference)
    from public.orders
    where customer_name in ('Cycle 12 Snapshot', 'Cycle 12 Reference Two')
  ),
  2::bigint,
  'sequence-backed order references are unique across multiple creations'
);

select throws_ok(
  $$
    select public.create_order_atomic(
      '{
        "order_type":"cart",
        "customer_name":"Atomic Failure",
        "customer_phone":"08000000000",
        "delivery_address":"14 Quiet Street, Abuja",
        "delivery_zone_name":"Central",
        "payment_method":"whatsapp",
        "subtotal_kobo":100,
        "delivery_fee_kobo":0,
        "total_kobo":100,
        "nutrition_completeness":"unavailable"
      }'::jsonb,
      '[{
        "product_name":"Valid first child",
        "unit_base_price_kobo":100,
        "quantity":1,
        "line_total_kobo":100,
        "addons":[]
      },{
        "product_name":"Invalid second child",
        "unit_base_price_kobo":0,
        "quantity":0,
        "line_total_kobo":0,
        "addons":[]
      }]'::jsonb
    )
  $$,
  '23514',
  null,
  'a child failure aborts the atomic persistence call'
);

select is(
  (select count(*) from public.orders where customer_name = 'Atomic Failure'),
  0::bigint,
  'a failed child insert leaves no partial order'
);

select * from finish();

rollback;
