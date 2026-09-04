begin;
select no_plan();

select has_trigger('public', 'orders', 'enforce_order_payment_method', 'every new order checks the method within its transaction');
select ok(not has_function_privilege('anon', 'private.enforce_order_payment_method()', 'EXECUTE'), 'public cannot invoke the trigger directly');
select ok(not has_function_privilege('anon', 'private.can_manage_checkout_settings()', 'EXECUTE'), 'public cannot call the private permission helper');

insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email, '', now(), '{}', '{}', now(), now()
from (values
  ('18900000-0000-4000-8000-000000000001'::uuid,'cycle18-owner@example.com'),
  ('18900000-0000-4000-8000-000000000002'::uuid,'cycle18-admin@example.com'),
  ('18900000-0000-4000-8000-000000000003'::uuid,'cycle18-editor@example.com'),
  ('18900000-0000-4000-8000-000000000004'::uuid,'cycle18-inactive@example.com')
) u(id,email);
insert into public.admin_users(id,email,role,is_active) values
  ('18900000-0000-4000-8000-000000000001','cycle18-owner@example.com','owner',true),
  ('18900000-0000-4000-8000-000000000002','cycle18-admin@example.com','admin',true),
  ('18900000-0000-4000-8000-000000000003','cycle18-editor@example.com','editor',true),
  ('18900000-0000-4000-8000-000000000004','cycle18-inactive@example.com','owner',false);

set local request.jwt.claims = '{"sub":"18900000-0000-4000-8000-000000000003","role":"authenticated"}';
set local role authenticated;
select ok(not private.can_manage_checkout_settings(), 'editor has no payment-setting permission');
with changed as (update public.checkout_settings set whatsapp_enabled=false where id returning id)
select is(count(*)::integer, 0, 'editor direct API update affects no rows') from changed;
reset role;
set local request.jwt.claims = '{"sub":"18900000-0000-4000-8000-000000000004","role":"authenticated"}';
set local role authenticated;
select ok(not private.can_manage_checkout_settings(), 'inactive owner cannot change payment settings');
with changed as (update public.checkout_settings set whatsapp_enabled=false where id returning id)
select is(count(*)::integer, 0, 'inactive owner direct update affects no rows') from changed;
reset role;
set local request.jwt.claims = '{"sub":"18900000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;
select ok(private.can_manage_checkout_settings(), 'active owner can change payment settings');
select lives_ok($$update public.checkout_settings set paystack_enabled=true, whatsapp_enabled=false,updated_by='18900000-0000-4000-8000-000000000003' where id$$, 'owner disables WhatsApp');
select is((select updated_by::text from public.checkout_settings where id), '18900000-0000-4000-8000-000000000001', 'forged settings actor is replaced with the authenticated owner');
select is((select count(*)::integer from public.admin_audit_log where action='checkout_settings_updated' and admin_user_id='18900000-0000-4000-8000-000000000001'), 1, 'payment-option change is audited once');
update public.checkout_settings set whatsapp_enabled=false where id;
select is((select count(*)::integer from public.admin_audit_log where action='checkout_settings_updated' and admin_user_id='18900000-0000-4000-8000-000000000001'), 1, 'saving identical flags does not invent another settings change');
reset role;

-- Minimal insert also proves validation precedes accepting a persisted order.
select throws_ok($$insert into public.orders(payment_method) values ('whatsapp')$$, 'P0001', 'PAYMENT_METHOD_DISABLED', 'disabled WhatsApp cannot bypass the trusted creation boundary');
select is((select count(*)::integer from public.orders), 0, 'rejected creation leaves no order');
update public.checkout_settings set paystack_enabled=false, whatsapp_enabled=true where id;
select throws_ok($$insert into public.orders(payment_method) values ('paystack')$$, 'P0001', 'PAYMENT_METHOD_DISABLED', 'generic create-order cannot bypass disabled Paystack');

set local request.jwt.claims = '{"sub":"18900000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;
select ok(private.can_manage_checkout_settings(), 'active admin is explicitly permitted');
select throws_ok($$update public.checkout_settings set whatsapp_enabled=false where id$$, '23514', null, 'last enabled method remains protected');
reset role;
select * from finish();
rollback;
