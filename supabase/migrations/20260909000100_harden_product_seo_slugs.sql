begin;

alter table public.products
  add constraint products_slug_length check (char_length(slug) between 1 and 120),
  add constraint products_slug_reserved check (slug <> all (array[
    'menu', 'saved', 'planner', 'checkout', 'payment', 'about', 'faq', 'contact',
    'delivery', 'meal-plans', 'high-protein-meals'
  ]));

create table public.product_slug_redirects (
  slug text primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint product_slug_redirects_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint product_slug_redirects_length check (char_length(slug) between 1 and 120)
);

alter table public.product_slug_redirects enable row level security;
revoke all on table public.product_slug_redirects from public, anon, authenticated;
grant select on table public.product_slug_redirects to anon, authenticated;
grant all privileges on table public.product_slug_redirects to service_role;

create policy product_slug_redirects_public_select
on public.product_slug_redirects
for select to anon, authenticated
using (
  exists (
    select 1 from public.products product
    join public.categories category on category.id = product.category_id
    where product.id = product_slug_redirects.product_id
      and product.status not in ('hidden', 'archived')
      and category.is_enabled
  )
);

create policy product_slug_redirects_active_admin_all
on public.product_slug_redirects
for all to authenticated
using ((select private.is_active_admin()))
with check ((select private.is_active_admin()));

create or replace function private.reject_reused_product_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.product_slug_redirects where slug = new.slug and product_id <> new.id) then
    raise exception 'Product slug has already been used' using errcode = '23505';
  end if;
  return new;
end;
$$;

revoke all on function private.reject_reused_product_slug() from public, anon, authenticated;
create trigger reject_reused_product_slug
before insert or update of slug on public.products
for each row execute function private.reject_reused_product_slug();

create or replace function private.preserve_product_slug_redirect()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.slug is distinct from old.slug then
    if exists (select 1 from public.product_slug_redirects where slug = new.slug and product_id <> new.id) then
      raise exception 'Product slug has already been used' using errcode = '23505';
    end if;
    insert into public.product_slug_redirects (slug, product_id)
    values (old.slug, new.id)
    on conflict (slug) do nothing;
    if exists (select 1 from public.product_slug_redirects where slug = old.slug and product_id <> new.id) then
      raise exception 'Previous product slug belongs to another product' using errcode = '23505';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.preserve_product_slug_redirect() from public, anon, authenticated;
create trigger preserve_product_slug_redirect
before update of slug on public.products
for each row execute function private.preserve_product_slug_redirect();

comment on table public.product_slug_redirects is
  'Cycle 19 history for resolving previously published product slugs without changing stable product identity.';

commit;
