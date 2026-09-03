begin;

select plan(25);

select has_extension('pg_trgm', 'trigram search support exists');
select has_index('public', 'orders', 'orders_reference_search_idx', 'order reference search is indexed');
select has_index('public', 'orders', 'orders_customer_name_search_idx', 'customer name search is indexed');
select has_index('public', 'orders', 'orders_customer_phone_search_idx', 'customer phone search is indexed');
select has_index('public', 'payments', 'payments_provider_reference_search_idx', 'Paystack reference search is indexed');
select has_function('public', 'list_admin_orders', array['text', 'text', 'text', 'text', 'text', 'date', 'date', 'integer', 'integer'], 'admin order list RPC exists');
select has_function('public', 'update_order_fulfilment_status', array['uuid', 'text'], 'fulfilment update RPC exists');
select has_function('private', 'can_transition_fulfilment_status', array['text', 'text'], 'central transition helper exists');
select ok(not has_function_privilege('anon', 'public.list_admin_orders(text,text,text,text,text,date,date,integer,integer)', 'EXECUTE'), 'anon cannot call order list RPC');
select ok(has_function_privilege('authenticated', 'public.list_admin_orders(text,text,text,text,text,date,date,integer,integer)', 'EXECUTE'), 'authenticated role can reach guarded order list RPC');
select ok(not has_function_privilege('anon', 'public.update_order_fulfilment_status(uuid,text)', 'EXECUTE'), 'anon cannot mutate fulfilment');
select ok(has_function_privilege('authenticated', 'public.update_order_fulfilment_status(uuid,text)', 'EXECUTE'), 'authenticated role can reach guarded fulfilment RPC');
select ok(not has_table_privilege('authenticated', 'public.orders', 'UPDATE'), 'browser clients still cannot update orders directly');
select ok(not has_table_privilege('authenticated', 'public.payments', 'UPDATE'), 'browser clients cannot update payment records');
set local role authenticated;
select throws_ok(
  $$select * from public.list_admin_orders()$$,
  '42501',
  'ADMIN_ACCESS_REQUIRED',
  'an authenticated identity without an active admin row cannot list private orders'
);
select throws_ok(
  $$select public.update_order_fulfilment_status('00000000-0000-0000-0000-000000000001', 'confirmed')$$,
  '42501',
  'ADMIN_ACCESS_REQUIRED',
  'an authenticated identity without an active admin row cannot mutate fulfilment'
);
reset role;
select ok(private.can_transition_fulfilment_status('pending', 'confirmed'), 'pending can advance to confirmed');
select ok(private.can_transition_fulfilment_status('confirmed', 'preparing'), 'confirmed can advance to preparing');
select ok(private.can_transition_fulfilment_status('preparing', 'ready'), 'preparing can advance to ready');
select ok(private.can_transition_fulfilment_status('ready', 'out_for_delivery'), 'ready can advance to out for delivery');
select ok(private.can_transition_fulfilment_status('out_for_delivery', 'delivered'), 'out for delivery can advance to delivered');
select ok(not private.can_transition_fulfilment_status('delivered', 'preparing'), 'delivered cannot move backwards');
select ok(private.can_transition_fulfilment_status('ready', 'cancelled'), 'ready can be cancelled before dispatch');
select ok(not private.can_transition_fulfilment_status('out_for_delivery', 'cancelled'), 'dispatched order cannot be cancelled');
select ok(not private.can_transition_fulfilment_status('cancelled', 'pending'), 'cancelled is terminal');

select * from finish();
rollback;
