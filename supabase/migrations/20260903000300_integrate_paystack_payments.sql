-- Cycle 14: atomic Paystack attempt creation and idempotent reconciliation.

alter table public.payments
  add column provider_transaction_id numeric(20, 0),
  add column provider_status text,
  add column provider_amount_kobo bigint,
  add column provider_currency text,
  add column failure_code text,
  add column last_event_at timestamptz;

alter table public.payments
  add constraint payments_provider_transaction_id_nonnegative
    check (provider_transaction_id is null or provider_transaction_id >= 0),
  add constraint payments_provider_amount_nonnegative
    check (provider_amount_kobo is null or provider_amount_kobo >= 0),
  add constraint payments_provider_currency_not_blank
    check (provider_currency is null or btrim(provider_currency) <> ''),
  add constraint payments_provider_status_not_blank
    check (provider_status is null or btrim(provider_status) <> ''),
  add constraint payments_failure_code_not_blank
    check (failure_code is null or btrim(failure_code) <> '');

create unique index payments_provider_transaction_unique_idx
  on public.payments (provider, provider_transaction_id)
  where provider_transaction_id is not null;

create or replace function public.create_paystack_order_atomic(
  p_order jsonb,
  p_items jsonb,
  p_provider_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  created jsonb;
  created_order_id uuid;
  created_payment_id uuid;
begin
  if p_order ->> 'payment_method' is distinct from 'paystack' then
    raise exception using errcode = '22023', message = 'Paystack persistence requires a Paystack order.';
  end if;

  -- Recheck the setting inside the persistence transaction. The storefront and
  -- Edge Function may have read an enabled value just before an admin disabled it.
  perform 1
  from public.checkout_settings
  where id and paystack_enabled
  for share;

  if not found then
    raise exception using errcode = 'P0001', message = 'PAYSTACK_DISABLED';
  end if;

  if p_provider_reference is null
    or btrim(p_provider_reference) = ''
    or p_provider_reference !~ '^[A-Za-z0-9.=-]+$'
    or length(p_provider_reference) > 100 then
    raise exception using errcode = '22023', message = 'Invalid Paystack reference.';
  end if;

  -- The permanent order and its pending attempt commit together before Paystack
  -- hosted checkout is initialized.
  created := public.create_order_atomic(p_order, p_items);
  created_order_id := (created ->> 'order_id')::uuid;

  update public.orders
  set payment_status = 'pending'
  where id = created_order_id;

  insert into public.payments (
    order_id,
    payment_method,
    provider,
    amount_kobo,
    status,
    provider_reference,
    verification_status
  ) values (
    created_order_id,
    'paystack',
    'paystack',
    (p_order ->> 'total_kobo')::bigint,
    'pending',
    p_provider_reference,
    'unverified'
  )
  returning id into created_payment_id;

  return created || jsonb_build_object(
    'payment_id', created_payment_id,
    'provider_reference', p_provider_reference,
    'payment_status', 'pending'
  );
end;
$$;

alter function public.create_paystack_order_atomic(jsonb, jsonb, text) owner to postgres;
revoke all on function public.create_paystack_order_atomic(jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_paystack_order_atomic(jsonb, jsonb, text) to service_role;

create or replace function public.record_paystack_initialization_failure_atomic(
  p_provider_reference text,
  p_failure_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  payment_record public.payments%rowtype;
begin
  -- Serialize competing webhook and verification requests for this reference.
  select * into payment_record
  from public.payments
  where provider = 'paystack' and provider_reference = p_provider_reference
  for update;

  if not found then
    return null;
  end if;

  if payment_record.status <> 'paid' then
    update public.payments
    set provider_status = 'initialization_failed',
        failure_code = coalesce(nullif(btrim(p_failure_code), ''), 'initialization_failed'),
        last_event_at = now()
    where id = payment_record.id;
  end if;

  return jsonb_build_object('payment_id', payment_record.id, 'status', payment_record.status);
end;
$$;

alter function public.record_paystack_initialization_failure_atomic(text, text) owner to postgres;
revoke all on function public.record_paystack_initialization_failure_atomic(text, text) from public, anon, authenticated;
grant execute on function public.record_paystack_initialization_failure_atomic(text, text) to service_role;

create or replace function public.reconcile_paystack_payment_atomic(
  p_provider_reference text,
  p_provider_status text,
  p_provider_amount_kobo bigint,
  p_provider_currency text,
  p_provider_transaction_id text,
  p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  payment_record public.payments%rowtype;
  normalized_status text := lower(coalesce(p_provider_status, ''));
  normalized_currency text := upper(coalesce(p_provider_currency, ''));
  transaction_id numeric(20, 0);
  outcome text;
begin
  if p_provider_transaction_id is not null and p_provider_transaction_id <> '' then
    if p_provider_transaction_id !~ '^[0-9]{1,20}$' then
      raise exception using errcode = '22023', message = 'Invalid provider transaction identifier.';
    end if;
    transaction_id := p_provider_transaction_id::numeric(20, 0);
  end if;

  select * into payment_record
  from public.payments
  where provider = 'paystack' and provider_reference = p_provider_reference
  for update;

  if not found then
    return null;
  end if;

  perform 1 from public.orders where id = payment_record.order_id for update;

  -- A duplicate success is a no-op, and no later event may downgrade a verified
  -- payment. Paystack retries webhooks until it receives acknowledgement.
  if payment_record.status = 'paid' and payment_record.verification_status = 'verified' then
    return jsonb_build_object(
      'payment_id', payment_record.id,
      'order_id', payment_record.order_id,
      'status', 'paid',
      'verification_status', 'verified',
      'idempotent', true
    );
  end if;

  -- Provider success is insufficient on its own: amount and NGN currency must
  -- match the server-created attempt before the order can become paid.
  if p_provider_amount_kobo is distinct from payment_record.amount_kobo then
    outcome := 'amount_mismatch';
  elsif normalized_currency <> 'NGN' then
    outcome := 'currency_mismatch';
  elsif normalized_status = 'success' then
    outcome := 'paid';
  elsif normalized_status in ('failed', 'abandoned', 'reversed') then
    outcome := 'failed';
  else
    outcome := 'pending';
  end if;

  update public.payments
  set provider_transaction_id = coalesce(transaction_id, provider_transaction_id),
      provider_status = nullif(normalized_status, ''),
      provider_amount_kobo = p_provider_amount_kobo,
      provider_currency = nullif(normalized_currency, ''),
      last_event_at = coalesce(p_occurred_at, now()),
      status = case outcome when 'paid' then 'paid' when 'pending' then 'pending' else 'failed' end,
      verification_status = case outcome when 'paid' then 'verified' when 'pending' then 'unverified' else 'failed' end,
      failure_code = case when outcome in ('amount_mismatch', 'currency_mismatch') then outcome when outcome = 'failed' then 'provider_failed' else null end,
      verified_at = case when outcome = 'paid' then coalesce(verified_at, now()) else null end
  where id = payment_record.id;

  -- Payment reconciliation deliberately never changes fulfilment_status; payment
  -- confirmation and operational delivery progress are separate state machines.
  update public.orders
  set payment_status = case outcome when 'paid' then 'paid' when 'pending' then 'pending' else 'failed' end
  where id = payment_record.order_id and payment_status <> 'paid';

  return jsonb_build_object(
    'payment_id', payment_record.id,
    'order_id', payment_record.order_id,
    'status', case outcome when 'amount_mismatch' then 'failed' when 'currency_mismatch' then 'failed' else outcome end,
    'verification_status', case outcome when 'paid' then 'verified' when 'pending' then 'unverified' else 'failed' end,
    'failure_code', case when outcome in ('amount_mismatch', 'currency_mismatch') then outcome when outcome = 'failed' then 'provider_failed' else null end,
    'idempotent', false
  );
end;
$$;

alter function public.reconcile_paystack_payment_atomic(text, text, bigint, text, text, timestamptz) owner to postgres;
revoke all on function public.reconcile_paystack_payment_atomic(text, text, bigint, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.reconcile_paystack_payment_atomic(text, text, bigint, text, text, timestamptz) to service_role;

comment on function public.create_paystack_order_atomic(jsonb, jsonb, text) is
  'Creates one authoritative order and its pending Paystack attempt in the same transaction.';
comment on function public.reconcile_paystack_payment_atomic(text, text, bigint, text, text, timestamptz) is
  'Locks and reconciles one known Paystack attempt and its order payment status atomically; fulfilment is never changed.';
