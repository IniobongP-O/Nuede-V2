begin;

select plan(25);

select has_column('public', 'payments', 'provider_transaction_id', 'provider transaction id is stored');
select has_column('public', 'payments', 'provider_amount_kobo', 'provider amount is retained for integrity diagnosis');
select has_column('public', 'payments', 'provider_currency', 'provider currency is retained');
select has_column('public', 'payments', 'failure_code', 'controlled payment failure reason is retained');
select has_index('public', 'payments', 'payments_provider_transaction_unique_idx', 'provider transaction identity is unique');
select has_function('public', 'create_paystack_order_atomic', array['jsonb', 'jsonb', 'text'], 'atomic Paystack order creation exists');
select has_function('public', 'reconcile_paystack_payment_atomic', array['text', 'text', 'bigint', 'text', 'text', 'timestamp with time zone'], 'atomic Paystack reconciliation exists');
select ok(not has_function_privilege('anon', 'public.create_paystack_order_atomic(jsonb,jsonb,text)', 'EXECUTE'), 'anon cannot create Paystack orders directly');
select ok(not has_function_privilege('authenticated', 'public.reconcile_paystack_payment_atomic(text,text,bigint,text,text,timestamp with time zone)', 'EXECUTE'), 'authenticated clients cannot reconcile payments');
select ok(has_function_privilege('service_role', 'public.reconcile_paystack_payment_atomic(text,text,bigint,text,text,timestamp with time zone)', 'EXECUTE'), 'service role can reconcile payments');

update public.checkout_settings set paystack_enabled = false, whatsapp_enabled = true where id;
select throws_ok(
  $$select public.create_paystack_order_atomic('{"payment_method":"paystack"}'::jsonb, '[]'::jsonb, 'NUE-disabled-at-rpc')$$,
  'P0001',
  'PAYSTACK_DISABLED',
  'atomic persistence rechecks disabled Paystack before creating an order'
);
select is((select count(*)::integer from public.payments where provider_reference = 'NUE-disabled-at-rpc'), 0, 'disabled atomic request creates no payment attempt');
update public.checkout_settings set paystack_enabled = true where id;

create temporary table cycle14_created as
select public.create_paystack_order_atomic(
  jsonb_build_object(
    'order_type', 'cart',
    'customer_name', 'Cycle 14 Customer',
    'customer_phone', '08000000000',
    'customer_email', 'cycle14@example.com',
    'delivery_address', '14 Test Street, Abuja',
    'delivery_landmark', null,
    'delivery_zone_id', null,
    'delivery_zone_name', 'Test zone',
    'payment_method', 'paystack',
    'subtotal_kobo', 1800000,
    'delivery_fee_kobo', 200000,
    'total_kobo', 2000000,
    'total_calories', null,
    'total_protein_g', null,
    'total_carbohydrates_g', null,
    'total_fat_g', null,
    'nutrition_completeness', 'unavailable',
    'meal_plan_start_date', null,
    'meal_plan_end_date', null
  ),
  jsonb_build_array(jsonb_build_object(
    'product_id', null,
    'variant_id', null,
    'product_name', 'Cycle 14 Meal',
    'variant_name', null,
    'unit_base_price_kobo', 1800000,
    'quantity', 1,
    'line_total_kobo', 1800000,
    'calories', null,
    'protein_g', null,
    'carbohydrates_g', null,
    'fat_g', null,
    'scheduled_for', null,
    'meal_slot', null,
    'addons', '[]'::jsonb
  )),
  'NUE-cycle14-success'
) as result;

select is((select result ->> 'payment_status' from cycle14_created), 'pending', 'creation returns pending payment state');
select is((select payment_status from public.orders where id = (select (result ->> 'order_id')::uuid from cycle14_created)), 'pending', 'new Paystack order is pending');
select is((select status from public.payments where provider_reference = 'NUE-cycle14-success'), 'pending', 'new Paystack payment attempt is pending');
select is((select amount_kobo from public.payments where provider_reference = 'NUE-cycle14-success'), 2000000::bigint, 'payment stores authoritative order total');

select public.reconcile_paystack_payment_atomic('NUE-cycle14-success', 'success', 2000000, 'NGN', '4099260516', now());
select is((select status from public.payments where provider_reference = 'NUE-cycle14-success'), 'paid', 'matching success marks payment paid');
select is((select verification_status from public.payments where provider_reference = 'NUE-cycle14-success'), 'verified', 'matching success marks payment verified');
select is((select payment_status from public.orders where id = (select (result ->> 'order_id')::uuid from cycle14_created)), 'paid', 'matching success atomically marks order paid');
select is((select fulfilment_status from public.orders where id = (select (result ->> 'order_id')::uuid from cycle14_created)), 'pending', 'payment reconciliation leaves fulfilment separate');

select public.reconcile_paystack_payment_atomic('NUE-cycle14-success', 'success', 2000000, 'NGN', '4099260516', now());
select is((select count(*)::integer from public.payments where provider_reference = 'NUE-cycle14-success'), 1, 'duplicate success creates no duplicate payment');
select is((select status from public.payments where provider_reference = 'NUE-cycle14-success'), 'paid', 'duplicate success remains paid');

update public.payments set status = 'pending', verification_status = 'unverified', verified_at = null, provider_transaction_id = null where provider_reference = 'NUE-cycle14-success';
update public.orders set payment_status = 'pending' where id = (select (result ->> 'order_id')::uuid from cycle14_created);
select public.reconcile_paystack_payment_atomic('NUE-cycle14-success', 'success', 1999999, 'NGN', '4099260517', now());
select is((select status from public.payments where provider_reference = 'NUE-cycle14-success'), 'failed', 'wrong amount cannot mark payment paid');
select is((select failure_code from public.payments where provider_reference = 'NUE-cycle14-success'), 'amount_mismatch', 'wrong amount records integrity failure');
select is((select payment_status from public.orders where id = (select (result ->> 'order_id')::uuid from cycle14_created)), 'failed', 'wrong amount cannot mark order paid');

select * from finish();
rollback;
