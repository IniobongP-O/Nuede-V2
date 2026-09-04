-- Cycle 18 follow-up: public views must obey the caller's grants and RLS.
-- Do not apply only the ALTER VIEW statements: guest reads also need the
-- narrowly scoped base-column grants and SELECT policies below.

alter table public.checkout_settings enable row level security;
alter table public.testimonials enable row level security;

-- Guests can read only columns used by each public view, including its filter.
-- No table-wide SELECT or mutation privilege is granted. Existing authenticated
-- admin privileges/policies are unchanged; non-admin JWTs stay denied by RLS.
revoke select on public.checkout_settings, public.testimonials from public, anon;
grant select (id, paystack_enabled, whatsapp_enabled)
  on public.checkout_settings to anon;
grant select (id, customer_name, message, rating, is_published)
  on public.testimonials to anon;

-- These policies must be anon-only. Authenticated has table-wide SELECT for
-- admin operations; adding a public policy for that role would expose metadata
-- to non-admin JWTs through direct base-table requests.
create policy checkout_settings_guest_options_select
on public.checkout_settings for select to anon
using (id);

create policy testimonials_guest_published_select
on public.testimonials for select to anon
using (is_published = true);

alter view public.checkout_payment_options
  set (security_invoker = true, security_barrier = true);
alter view public.published_testimonials
  set (security_invoker = true, security_barrier = true);

revoke all on public.checkout_payment_options, public.published_testimonials
  from public, anon, authenticated;
grant select on public.checkout_payment_options, public.published_testimonials
  to anon, authenticated, service_role;

comment on view public.checkout_payment_options is
  'Invoker-security checkout flags. Guest column grants and RLS protect private settings metadata.';
comment on view public.published_testimonials is
  'Invoker-security public stories. Guests read only published content; metadata and drafts remain private.';

notify pgrst, 'reload schema';
