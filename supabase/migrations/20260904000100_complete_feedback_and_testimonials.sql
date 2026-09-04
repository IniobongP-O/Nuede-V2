-- Cycle 17: reuse the existing tables and role model, with narrow public contracts.
-- NOT VALID preserves historical feedback verbatim; new/changed rows are checked.
alter table public.feedback add constraint feedback_content_limits check (
  char_length(customer_name) between 1 and 120
  and customer_name ~ '[^[:space:]]'
  and char_length(email) <= 254
  and email ~ '^[^[:space:]@]+@[^[:space:]@.]+(\.[^[:space:]@.]+)+$'
  and subject in ('general_inquiry', 'order_issue', 'menu_suggestion', 'delivery_feedback', 'compliment', 'other')
  and char_length(message) between 1 and 5000
  and message ~ '[^[:space:]]'
) not valid;
alter table public.testimonials add constraint testimonials_content_limits check (
  char_length(customer_name) between 1 and 120
  and customer_name ~ '[^[:space:]]'
  and char_length(message) between 1 and 5000
  and message ~ '[^[:space:]]'
) not valid;

revoke insert on public.feedback from anon;
grant insert (customer_name, email, subject, rating, message) on public.feedback to anon;
-- No SELECT/UPDATE/DELETE grants or policies are added for public feedback.
-- In particular, clients cannot forge id, created_at or future internal fields.

drop policy testimonials_public_select on public.testimonials;
revoke select on public.testimonials from anon;
-- Authenticated base-table reads continue through the active-admin policy only.
-- As with checkout_payment_options, this owner-controlled view is intentionally
-- privileged: its explicit publication predicate and projection are the contract.
create view public.published_testimonials with (security_barrier = true) as
select id, customer_name, message, rating
from public.testimonials where is_published = true;
alter view public.published_testimonials owner to postgres;
revoke all on public.published_testimonials from public, anon, authenticated;
grant select on public.published_testimonials to anon, authenticated, service_role;

create index feedback_subject_rating_created_idx on public.feedback (subject, rating, created_at desc, id);
create index feedback_created_idx on public.feedback (created_at desc, id);

create or replace function private.prepare_testimonial_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.is_published then
      raise exception 'Create an unpublished testimonial before publishing it.' using errcode = '23514';
    end if;
    new.published_at := null;
  else
    if new.source_feedback_id is distinct from old.source_feedback_id and new.source_feedback_id is not null then
      raise exception 'A testimonial source cannot be reassigned.' using errcode = '23514';
    end if;
    new.published_at := case when not new.is_published then null
      when not old.is_published then now() else old.published_at end;
  end if;
  return new;
end;
$$;
revoke all on function private.prepare_testimonial_change() from public, anon, authenticated;
create trigger testimonials_prepare_change before insert or update on public.testimonials
for each row execute function private.prepare_testimonial_change();

create or replace function private.audit_testimonial_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text;
  event_name text;
begin
  select email into actor_email from public.admin_users
  where id = actor_id and is_active and role in ('owner', 'admin', 'editor');
  if actor_email is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  event_name := case when tg_op = 'DELETE' then 'testimonial_deleted'
    when tg_op = 'INSERT' and new.source_feedback_id is not null then 'feedback_converted_to_testimonial'
    when tg_op = 'INSERT' then 'testimonial_created'
    when new.is_published is distinct from old.is_published then
      case when new.is_published then 'testimonial_published' else 'testimonial_unpublished' end
    else 'testimonial_updated' end;
  insert into public.admin_audit_log
    (admin_user_id, admin_email_snapshot, action, entity_type, entity_id, previous_values, new_values)
  values (actor_id, actor_email, event_name, 'testimonial', coalesce(new.id, old.id),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end);
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
alter function private.audit_testimonial_change() owner to postgres;
revoke all on function private.audit_testimonial_change() from public, anon, authenticated;
create trigger testimonials_write_audit after insert or update or delete on public.testimonials
for each row execute function private.audit_testimonial_change();

-- Feedback must not enter a publication (including DELETE events, which do not
-- carry a row usable for RLS filtering). Testimonials use public-view refetch.
do $$
begin
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
    and schemaname = 'public' and tablename = 'feedback') then
    alter publication supabase_realtime drop table public.feedback;
  end if;
end;
$$;
