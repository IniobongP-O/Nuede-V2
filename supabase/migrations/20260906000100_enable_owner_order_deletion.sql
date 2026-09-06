-- Owner-only, audited deletion of a complete order record graph.

create or replace function public.delete_admin_order(p_order_id uuid, p_confirmation text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text;
  order_record public.orders%rowtype;
  deleted_item_count integer;
  deleted_payment_count integer;
begin
  select admin_user.email
  into actor_email
  from public.admin_users as admin_user
  where admin_user.id = actor_id
    and admin_user.is_active
    and admin_user.role = 'owner';

  if actor_email is null then
    raise exception using errcode = '42501', message = 'OWNER_ACCESS_REQUIRED';
  end if;

  select * into order_record
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'ORDER_NOT_FOUND';
  end if;

  if btrim(coalesce(p_confirmation, '')) <> order_record.order_reference then
    raise exception using errcode = '22023', message = 'ORDER_DELETE_CONFIRMATION_MISMATCH';
  end if;

  select count(*)::integer into deleted_item_count
  from public.order_items
  where order_id = order_record.id;

  select count(*)::integer into deleted_payment_count
  from public.payments
  where order_id = order_record.id;

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
    'order_deleted',
    'order',
    order_record.id,
    jsonb_build_object(
      'order_reference', order_record.order_reference,
      'payment_status', order_record.payment_status,
      'fulfilment_status', order_record.fulfilment_status,
      'total_kobo', order_record.total_kobo,
      'order_item_count', deleted_item_count,
      'payment_count', deleted_payment_count
    ),
    jsonb_build_object('deleted', true)
  );

  delete from public.order_item_addons as addon
  using public.order_items as item
  where addon.order_item_id = item.id
    and item.order_id = order_record.id;

  delete from public.payments
  where order_id = order_record.id;

  delete from public.order_items
  where order_id = order_record.id;

  delete from public.orders
  where id = order_record.id;

  return jsonb_build_object(
    'id', order_record.id,
    'order_reference', order_record.order_reference,
    'deleted', true,
    'deleted_order_items', deleted_item_count,
    'deleted_payments', deleted_payment_count
  );
end;
$$;

alter function public.delete_admin_order(uuid, text) owner to postgres;
revoke all on function public.delete_admin_order(uuid, text) from public, anon, authenticated;
grant execute on function public.delete_admin_order(uuid, text) to authenticated;

comment on function public.delete_admin_order(uuid, text) is
  'Permanently deletes one complete order graph only for an active owner after exact reference confirmation, while retaining a minimal audit event.';
