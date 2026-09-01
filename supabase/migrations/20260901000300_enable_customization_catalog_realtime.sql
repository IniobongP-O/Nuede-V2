-- Nuede V2 Cycle 7: keep open customization state aligned with add-on changes.
-- RLS remains the public-read boundary; this migration grants no privileges.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'product_addons'
    ) then
      alter publication supabase_realtime add table public.product_addons;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'product_addon_assignments'
    ) then
      alter publication supabase_realtime add table public.product_addon_assignments;
    end if;
  end if;
end;
$$;
