# Supabase advisor: the two public views

The dashboard warnings concern `public.checkout_payment_options` and `public.published_testimonials`. Earlier Nuede migrations created postgres-owned views without `security_invoker=true`. PostgreSQL therefore checks underlying access as the view owner, bypassing the caller's RLS. `security_barrier=true` does not change that execution identity. The explicit projections were intentional, but the owner-privilege warning is valid.

## Fix prepared

Apply `supabase/migrations/20260904000400_use_invoker_public_views.sql` after the earlier migrations. It sets both views to invoker security, retains their barriers, and grants guests only the underlying columns needed by those queries. Guest SELECT policies expose only the singleton checkout flags and published testimonials. No guest writes are granted. Private feedback links, actor IDs and timestamps remain inaccessible.

Do **not** run only two `ALTER VIEW` commands: without the accompanying grants and policies, public checkout/testimonial reads would fail. Do **not** grant anonymous table-wide SELECT to solve that failure: it would expose metadata.

The guest policies are deliberately `TO anon`, not `TO authenticated`. Authenticated users have table-wide grants for protected administration, so a permissive public policy for that role would reveal metadata to non-admin JWTs. Existing active-admin RLS remains in force. Authenticated non-admin/inactive identities get no rows from these views. The storefront continues using its existing anonymous client with session persistence, refresh and URL detection disabled; no frontend changes are required.

## Apply in Supabase

Prefer the normal migration workflow in `DEPLOYMENT.md` so migration history is recorded. If using SQL Editor, run the complete migration file in one transaction (`BEGIN;`, the full file, then `COMMIT;`) on the intended Nuede V2 project. If applied manually, reconcile the matching migration version with CLI history before a later `db push`; do not blindly reapply its policy-creation statements.

After applying, inspect:

```sql
select n.nspname as schema_name, c.relname as view_name, c.reloptions
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('checkout_payment_options', 'published_testimonials');
```

Both rows must include `security_invoker=true` and `security_barrier=true`. Refresh/rerun the Security Advisor, and confirm that both warnings disappear. Verify storefront checkout options and published stories, admin settings/content, unpublished exclusion and metadata denial. SQL Editor runs as a privileged role by default; a successful query there alone is not guest RLS evidence.

## Evidence and limits

- `node --test scripts/verify-public-view-rls.test.js`: **7 tests PASS**, executing the actual migration in PGlite's embedded PostgreSQL with a focused privilege fixture. It verifies both invoker options, guest output, direct-table draft/metadata denial, unauthorized writes, non-admin denial, admin reads and publication/settings changes.
- `npm test`: **179 PASS**; `npm run lint`: PASS.
- `supabase/tests/database/013_public_view_invoker.test.sql`: additional full-Supabase pgTAP coverage prepared, **NOT RUN** here. Embedded PostgreSQL is not the full hosted Supabase stack.
- Follow-up read-only hosted checks: both views return HTTP 200; `select=*` on both base tables returns HTTP 401. This is newer evidence than the initial Cycle 18 audit and shows those missing-view/base-wildcard findings have changed. It does not reveal hosted `reloptions`, so it cannot prove the advisor warnings are fixed.
- Hosted application of this new migration and advisor rescan: **NOT RUN**. The available browser has no authenticated Supabase dashboard tab, and no authenticated deployment connection is available in this session.

References: [Supabase view/RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security), [column-level permissions](https://supabase.com/docs/guides/database/postgres/column-level-security), [PostgreSQL view security](https://www.postgresql.org/docs/current/sql-createview.html).
