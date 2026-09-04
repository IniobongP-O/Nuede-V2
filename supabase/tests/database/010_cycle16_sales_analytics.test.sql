begin;

select plan(44);

select has_index('public', 'payments', 'payments_verified_sales_idx', 'eligible payment lookup is indexed');
select has_function('public', 'get_admin_sales_analytics', array['date', 'date'], 'range-aware admin analytics RPC exists');
select has_view('private', 'analytics_eligible_sales', 'canonical eligible-sale relation exists');
select has_view('private', 'daily_sales', 'daily sales aggregate exists');
select has_view('private', 'product_sales', 'product sales aggregate exists');
select has_view('private', 'variant_sales', 'variant sales aggregate exists');
select has_view('private', 'addon_sales', 'add-on sales aggregate exists');
select has_view('private', 'delivery_zone_sales', 'delivery-zone sales aggregate exists');
select has_view('private', 'payment_method_sales', 'payment-method sales aggregate exists');
select ok(not has_function_privilege('anon', 'public.get_admin_sales_analytics(date,date)', 'EXECUTE'), 'anonymous callers cannot execute analytics');
select ok(has_function_privilege('authenticated', 'public.get_admin_sales_analytics(date,date)', 'EXECUTE'), 'authenticated role can reach the guarded analytics RPC');

set local role authenticated;
select throws_ok(
  $$select public.get_admin_sales_analytics('2026-09-01', '2026-09-03')$$,
  '42501',
  'ADMIN_ACCESS_REQUIRED',
  'an authenticated identity without an active admin row cannot read analytics'
);
reset role;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '16900000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'cycle16-admin@example.com', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());
insert into public.admin_users (id, email, role, is_active)
values ('16900000-0000-4000-8000-000000000001', 'cycle16-admin@example.com', 'admin', true);
set local request.jwt.claims = '{"sub":"16900000-0000-4000-8000-000000000001","role":"authenticated"}';

insert into public.orders (
  id, order_reference, order_type, customer_name, customer_phone, delivery_address,
  delivery_zone_id, delivery_zone_name, payment_method, payment_status, fulfilment_status,
  subtotal_kobo, delivery_fee_kobo, total_kobo, nutrition_completeness,
  meal_plan_start_date, meal_plan_end_date, created_at
)
values
  ('16100000-0000-4000-8000-000000000001', 'NUE-C16-PAID-A', 'cart', 'Analytics A', '08000000001', 'A Street', '50000000-0000-4000-8000-000000000001', 'Historical Zone A', 'paystack', 'paid', 'confirmed', 900000, 100000, 1000000, 'unavailable', null, null, '2026-08-20T10:00:00Z'),
  ('16100000-0000-4000-8000-000000000002', 'NUE-C16-PAID-B', 'meal_plan', 'Analytics B', '08000000002', 'B Street', '50000000-0000-4000-8000-000000000002', 'Historical Zone B', 'paystack', 'paid', 'preparing', 1800000, 200000, 2000000, 'unavailable', '2026-09-07', '2026-09-09', '2026-08-21T10:00:00Z'),
  ('16100000-0000-4000-8000-000000000003', 'NUE-C16-PENDING', 'cart', 'Analytics Pending', '08000000003', 'C Street', null, 'Pending Zone', 'paystack', 'pending', 'pending', 4900000, 100000, 5000000, 'unavailable', null, null, '2026-09-02T10:00:00Z'),
  ('16100000-0000-4000-8000-000000000004', 'NUE-C16-FAILED', 'cart', 'Analytics Failed', '08000000004', 'D Street', null, 'Failed Zone', 'paystack', 'failed', 'pending', 700000, 100000, 800000, 'unavailable', null, null, '2026-09-02T10:00:00Z'),
  ('16100000-0000-4000-8000-000000000005', 'NUE-C16-WHATSAPP', 'cart', 'Analytics WhatsApp', '08000000005', 'E Street', null, 'Manual Zone', 'whatsapp', 'unpaid', 'delivered', 1100000, 100000, 1200000, 'unavailable', null, null, '2026-09-02T10:00:00Z'),
  ('16100000-0000-4000-8000-000000000006', 'NUE-C16-OLD', 'cart', 'Analytics Old', '08000000006', 'F Street', null, 'Old Zone', 'paystack', 'paid', 'delivered', 400000, 100000, 500000, 'unavailable', null, null, '2026-07-30T10:00:00Z');

insert into public.order_items (
  id, order_id, product_id, variant_id, product_name, variant_name,
  unit_base_price_kobo, quantity, line_total_kobo
)
values
  ('16200000-0000-4000-8000-000000000001', '16100000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', null, 'Historical Chicken', null, 400000, 2, 900000),
  ('16200000-0000-4000-8000-000000000002', '16100000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000001', 'Historical Pepper Bowl', 'Historical Rice Variant', 600000, 3, 1800000),
  ('16200000-0000-4000-8000-000000000003', '16100000-0000-4000-8000-000000000003', null, null, 'Pending Product', null, 490000, 10, 4900000),
  ('16200000-0000-4000-8000-000000000004', '16100000-0000-4000-8000-000000000004', null, null, 'Failed Product', null, 700000, 1, 700000),
  ('16200000-0000-4000-8000-000000000005', '16100000-0000-4000-8000-000000000005', null, null, 'WhatsApp Product', null, 1100000, 1, 1100000),
  ('16200000-0000-4000-8000-000000000006', '16100000-0000-4000-8000-000000000006', null, null, 'Old Product', null, 400000, 1, 400000);

insert into public.order_item_addons (order_item_id, addon_id, addon_name, unit_price_kobo)
values ('16200000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', 'Historical Sauce', 50000);

insert into public.payments (
  order_id, payment_method, provider, amount_kobo, status, provider_reference,
  verification_status, verified_at, provider_transaction_id, provider_status,
  provider_amount_kobo, provider_currency, last_event_at
)
values
  ('16100000-0000-4000-8000-000000000001', 'paystack', 'paystack', 1000000, 'paid', 'C16-A-PRIMARY', 'verified', '2026-09-01T23:30:00Z', 16100001, 'success', 1000000, 'NGN', '2026-09-01T23:30:00Z'),
  ('16100000-0000-4000-8000-000000000001', 'paystack', 'paystack', 1000000, 'paid', 'C16-A-DUPLICATE', 'verified', '2026-09-02T01:00:00Z', 16100002, 'success', 1000000, 'NGN', '2026-09-02T01:00:00Z'),
  ('16100000-0000-4000-8000-000000000002', 'paystack', 'paystack', 2000000, 'paid', 'C16-B-PRIMARY', 'verified', '2026-09-02T22:59:00Z', 16100003, 'success', 2000000, 'NGN', '2026-09-02T22:59:00Z'),
  ('16100000-0000-4000-8000-000000000003', 'paystack', 'paystack', 5000000, 'pending', 'C16-PENDING', 'unverified', null, 16100004, 'pending', 5000000, 'NGN', '2026-09-02T10:00:00Z'),
  ('16100000-0000-4000-8000-000000000004', 'paystack', 'paystack', 800000, 'failed', 'C16-FAILED', 'failed', null, 16100005, 'failed', 800000, 'NGN', '2026-09-02T10:00:00Z'),
  ('16100000-0000-4000-8000-000000000006', 'paystack', 'paystack', 500000, 'paid', 'C16-OLD', 'verified', '2026-08-01T10:00:00Z', 16100006, 'success', 500000, 'NGN', '2026-08-01T10:00:00Z');

select is((select count(*)::integer from private.analytics_eligible_sales where sale_date between '2026-09-01' and '2026-09-03'), 2, 'only two eligible orders fall in range');
select is((select sum(revenue_kobo) from private.analytics_eligible_sales where sale_date between '2026-09-01' and '2026-09-03'), 3000000::bigint, 'verified revenue is exact integer kobo');
select is((select count(*)::bigint from private.analytics_eligible_sales where sale_date between '2026-09-01' and '2026-09-03'), 2::bigint, 'paid orders count distinct canonical orders');
select is((select ((public.get_admin_sales_analytics('2026-09-01', '2026-09-03') -> 'summary' ->> 'average_order_value_kobo'))::bigint), 1500000::bigint, 'AOV is revenue divided by paid orders');
select is((select ((public.get_admin_sales_analytics('2026-09-01', '2026-09-03') -> 'summary' ->> 'items_sold'))::bigint), 5::bigint, 'item quantities sum to five');
select is(jsonb_array_length(public.get_admin_sales_analytics('2026-09-01', '2026-09-03') -> 'daily_sales'), 3, 'daily result safely fills every selected date');
select is((select revenue_kobo from private.daily_sales where sale_date = '2026-09-02'), 3000000::bigint, 'both Lagos-local verified payments bucket on September 2');
select is((select count(*)::integer from private.analytics_eligible_sales where order_id = '16100000-0000-4000-8000-000000000003'), 0, 'pending payment contributes no sale');
select is((select count(*)::integer from private.analytics_eligible_sales where order_id = '16100000-0000-4000-8000-000000000004'), 0, 'failed payment contributes no sale');
select is((select count(*)::integer from private.analytics_eligible_sales where order_id = '16100000-0000-4000-8000-000000000005'), 0, 'unpaid WhatsApp order contributes no sale');
select is((select count(*)::integer from private.analytics_eligible_sales where order_id = '16100000-0000-4000-8000-000000000001'), 1, 'duplicate successful payment evidence cannot duplicate an order');
select is((select revenue_kobo from private.product_sales where product_name = 'Historical Chicken'), 800000::bigint, 'product revenue includes base price only');

update public.products set price_kobo = 1200000 where id = '20000000-0000-4000-8000-000000000001';
select is((select revenue_kobo from private.product_sales where product_name = 'Historical Chicken'), 800000::bigint, 'current menu price changes do not rewrite historical revenue');
select is((select quantity_sold from private.variant_sales where variant_name = 'Historical Rice Variant'), 3::bigint, 'variant quantity uses purchased item quantity');
select is((select revenue_kobo from private.variant_sales where variant_name = 'Historical Rice Variant'), 1800000::bigint, 'variant revenue uses purchased base price');
select is((select quantity_sold from private.addon_sales where addon_name = 'Historical Sauce'), 2::bigint, 'add-on quantity follows parent item quantity');
select is((select revenue_kobo from private.addon_sales where addon_name = 'Historical Sauce'), 100000::bigint, 'add-on revenue uses purchased price');
select is((select count(*)::integer from private.delivery_zone_sales where sale_date = '2026-09-02'), 2, 'multiple historical delivery zones remain distinct');
select is((select revenue_kobo from private.payment_method_sales where sale_date = '2026-09-02' and payment_method = 'paystack'), 3000000::bigint, 'payment-method total reconciles to revenue');
select is(((public.get_admin_sales_analytics('2026-09-01', '2026-09-03') -> 'payment_method_sales' -> 0 ->> 'revenue_share_percent'))::numeric, 100.0::numeric, 'payment-method revenue share is calculated from trusted range revenue');
select is((select quantity_sold from private.variant_sales where product_name = 'Historical Pepper Bowl'), 3::bigint, 'paid meal-plan items participate in analytics');
select is(((public.get_admin_sales_analytics('2026-09-02', '2026-09-02') -> 'summary' ->> 'revenue_kobo'))::bigint, 3000000::bigint, 'one-day range includes both boundary-safe Lagos sales');
select is(((public.get_admin_sales_analytics('2026-10-01', '2026-10-01') -> 'summary' ->> 'revenue_kobo'))::bigint, 0::bigint, 'zero-data range returns zero revenue');
select is(((public.get_admin_sales_analytics('2026-10-01', '2026-10-01') -> 'summary' ->> 'paid_orders'))::bigint, 0::bigint, 'zero-data range returns zero paid orders');
select is((select sale_date from private.analytics_eligible_sales where order_id = '16100000-0000-4000-8000-000000000001'), '2026-09-02'::date, 'UTC timestamp crosses into the correct Lagos business date');

set local role authenticated;
select lives_ok(
  $$select public.get_admin_sales_analytics('2026-09-01', '2026-09-03')$$,
  'an authorized active admin can read analytics'
);
select throws_ok(
  $$select public.get_admin_sales_analytics('2026-09-03', '2026-09-01')$$,
  '22023',
  'INVALID_ANALYTICS_DATE_RANGE',
  'reversed custom range is rejected by the database'
);
reset role;

-- Cycle 18 extends this known dataset without changing verified revenue eligibility.
select is((public.get_admin_sales_analytics('2026-09-01','2026-09-03')->'order_activity'->>'total_orders')::integer,3,'activity uses order creation dates rather than payment dates');
select is((public.get_admin_sales_analytics('2026-09-01','2026-09-03')->'order_activity'->>'failed_payments')::integer,1,'failed order counted operationally without revenue');
select is((public.get_admin_sales_analytics('2026-09-01','2026-09-03')->'order_activity'->>'cancelled_orders')::integer,0,'no fabricated cancellations');
select is((select (x->>'revenue_kobo')::bigint from jsonb_array_elements(public.get_admin_sales_analytics('2026-09-01','2026-09-03')->'order_type_sales') x where x->>'order_type'='meal_plan'),2000000::bigint,'meal-plan verified revenue is distinguished');
select is((select (x->>'paid_orders')::integer from jsonb_array_elements(public.get_admin_sales_analytics('2026-09-01','2026-09-03')->'order_type_sales') x where x->>'order_type'='cart'),1,'cart paid count remains distinct despite duplicate evidence');
select * from finish();
rollback;
