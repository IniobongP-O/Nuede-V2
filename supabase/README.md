# Supabase backend

Supabase PostgreSQL, Auth, Storage, Realtime, and Edge Functions form the trusted Nuede backend.

Cycle 2 adds the local PostgreSQL foundation without connecting to a remote project.

- `config.toml` configures the disposable local stack.
- `migrations/` is the complete schema-change source of truth.
- `seed.sql` provides deterministic development data.
- `tests/database/` contains pgTAP structure, constraint, and seed tests.
- `functions/` remains reserved for server-authoritative backend operations in their approved cycles.

Start and recreate locally from the repository root:

```sh
npm run supabase:start
npm run db:reset
npm run db:test
```

Do not link, push, or remotely reset a Supabase project during local verification. RLS/auth behavior begins in Cycle 3, admin catalog auditing begins in Cycle 4, Storage buckets begin in Cycle 5, and commerce Edge Functions arrive in later cycles.

Backend code must never be imported into a Vite application.
