# Supabase backend

Supabase PostgreSQL, Auth, Storage, Realtime, and Edge Functions form the trusted Nuede backend.

Cycle 0 establishes directories and rules only. It does not connect to a project, create a schema, add RLS policies, seed commercial data, or implement functions.

- `migrations/` will contain reproducible schema changes beginning in Cycle 2.
- `functions/` will contain server-authoritative backend operations in their approved cycles.
- `seed.sql` will contain development seed data beginning in Cycle 2.

Backend code must never be imported into a Vite application.
