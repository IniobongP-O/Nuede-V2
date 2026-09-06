-- Audited manual payment confirmation for WhatsApp orders only.

create or replace function public.mark_whatsapp_order_paid(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text;
  order_record public.orders%rowtype;
  created_payment_id uuid;
begin
  select admin_user.email
  into actor_email
  from public.admin_users as admin_user
  where admin_user.id = actor_id
    and admin_user.is_active
    and admin_user.role in ('owner', 'admin');

  if actor_email is null then
    raise exception using errcode = '42501', message = 'PAYMENT_MANAGEMENT_ACCESS_REQUIRED';
  end if;

  select * into order_record
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'ORDER_NOT_FOUND';
  end if;

  if order_record.payment_method <> 'whatsapp' then
    raise exception using errcode = '22023', message = 'WHATSAPP_ORDER_REQUIRED';
  end if;

  if order_record.payment_status = 'paid' then
    return jsonb_build_object(
      'id', order_record.id,
      'order_reference', order_record.order_reference,
      'payment_status', 'paid',
      'already_paid', true
    );
  end if;

  if order_record.payment_status not in ('unpaid', 'pending', 'failed') then
    raise exception using
      errcode = 'P0001',
      message = 'INVALID_WHATSAPP_PAYMENT_TRANSITION',
      detail = order_record.payment_status || ' -> paid';
  end if;

  update public.orders
  set payment_status = 'paid'
  where id = order_record.id;

  insert into public.payments (
    order_id,
    payment_method,
    provider,
    amount_kobo,
    status,
    verification_status
  ) values (
    order_record.id,
    'whatsapp',
    null,
    order_record.total_kobo,
    'paid',
    'not_applicable'
  )
  returning id into created_payment_id;

  insert into public.admin_audit_log (
    admin_user_id,
    admin_email_snapshot,
    action,
    entity_type,
    entity_id,
    previous_values,
    new_values
  ) values (
    actor_id,
    actor_email,
    'whatsapp_order_marked_paid',
    'order',
    order_record.id,
    jsonb_build_object(
      'order_reference', order_record.order_reference,
      'payment_method', order_record.payment_method,
      'payment_status', order_record.payment_status
    ),
    jsonb_build_object(
      'order_reference', order_record.order_reference,
      'payment_method', 'whatsapp',
      'payment_status', 'paid',
      'amount_kobo', order_record.total_kobo,
      'payment_id', created_payment_id
    )
  );

  return jsonb_build_object(
    'id', order_record.id,
    'order_reference', order_record.order_reference,
    'payment_status', 'paid',
    'payment_id', created_payment_id,
    'already_paid', false
  );
end;
$$;

alter function public.mark_whatsapp_order_paid(uuid) owner to postgres;
revoke all on function public.mark_whatsapp_order_paid(uuid) from public, anon, authenticated;
grant execute on function public.mark_whatsapp_order_paid(uuid) to authenticated;

create or replace view private.analytics_eligible_sales as
select
  order_row.id as order_id,
  order_row.order_reference,
  order_row.order_type,
  order_row.payment_method,
  order_row.delivery_zone_id,
  order_row.delivery_zone_name,
  order_row.subtotal_kobo,
  order_row.delivery_fee_kobo,
  order_row.total_kobo as revenue_kobo,
  trusted_payment.paid_at,
  (trusted_payment.paid_at at time zone 'Africa/Lagos')::date as sale_date
from public.orders as order_row
cross join lateral (
  select min(evidence.paid_at) as paid_at
  from (
    select payment.verified_at as paid_at
    from public.payments as payment
    where order_row.payment_method = 'paystack'
      and payment.order_id = order_row.id
      and payment.payment_method = 'paystack'
      and payment.provider = 'paystack'
      and payment.status = 'paid'
      and payment.verification_status = 'verified'
      and payment.verified_at is not null
      and payment.amount_kobo = order_row.total_kobo
      and payment.provider_amount_kobo = order_row.total_kobo
      and upper(payment.provider_currency) = 'NGN'

    union all

    select payment.created_at as paid_at
    from public.payments as payment
    where order_row.payment_method = 'whatsapp'
      and payment.order_id = order_row.id
      and payment.payment_method = 'whatsapp'
      and payment.provider is null
      and payment.status = 'paid'
      and payment.verification_status = 'not_applicable'
      and payment.amount_kobo = order_row.total_kobo
      and exists (
        select 1
        from public.admin_audit_log as audit
        where audit.action = 'whatsapp_order_marked_paid'
          and audit.entity_type = 'order'
          and audit.entity_id = order_row.id
          and audit.new_values ->> 'payment_id' = payment.id::text
      )
  ) as evidence
) as trusted_payment
where order_row.payment_status = 'paid'
  and order_row.payment_method in ('paystack', 'whatsapp')
  and trusted_payment.paid_at is not null;

comment on view private.analytics_eligible_sales is
  'Canonical one-row-per-order sales evidence: verified matching Paystack payments or matching WhatsApp payments explicitly confirmed and audited by an authorized administrator.';

comment on function public.mark_whatsapp_order_paid(uuid) is
  'Lets an active owner or administrator atomically record full payment for an eligible WhatsApp order, create its manual payment record, retain an audit event, and make it eligible for sales analytics. Paystack orders are never mutated.';
