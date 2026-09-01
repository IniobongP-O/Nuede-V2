-- Nuede V2 Cycle 6: publish only the catalog tables needed by the live menu.
-- Existing RLS policies continue to determine which rows anonymous storefront
-- clients may receive; this migration grants no new table privileges.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories'
    ) then
      alter publication supabase_realtime add table public.categories;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
    ) then
      alter publication supabase_realtime add table public.products;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'product_variants'
    ) then
      alter publication supabase_realtime add table public.product_variants;
    end if;
  end if;
end;
$$;
