# Database migrations

Every Nuede schema change must be represented by an ordered Supabase migration. Dashboard-only schema work is prohibited.

The initial commercial schema is:

```text
20260831000100_create_database_foundation.sql
```

It creates the Cycle 2 relational foundation atomically. After its checkpoint, add a new timestamped migration for every schema change; do not edit migration history that may already have been applied.

RLS policies, Storage setup, analytics views, and commerce functions do not belong in the Cycle 2 migration.
