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

Cycle 5 creates the `product-images` bucket, active-admin Storage policies, grouped
orderability/default safeguards, atomic variant/add-on helpers, and expanded catalog
auditing through `20260901000100_complete_catalog_images_variants_addons.sql`.

Cycle 7 adds `product_addons` and `product_addon_assignments` to the existing
`supabase_realtime` publication through
`20260901000300_enable_customization_catalog_realtime.sql`. It grants no new table
privileges and leaves anonymous visibility controlled by the existing RLS policies.

Cycle 12 adds the JavaScript `create-order` Edge Function and
`20260903000200_create_secure_order_persistence.sql`. The function re-reads current
catalog, delivery, and checkout settings, calculates authoritative integer-kobo
totals and nutrition, snapshots the purchase, then invokes a service-role-only RPC
that writes the complete order graph in one PostgreSQL transaction.

Cycle 14 adds `20260903000300_integrate_paystack_payments.sql` plus
`initialize-paystack`, `paystack-webhook`, and `verify-paystack-payment`. The first
atomically stores an order and pending Paystack attempt before hosted-checkout
initialization; the latter two share amount/currency-checked, idempotent, atomic
payment reconciliation. Webhooks authenticate the raw body before mutation.

Backend code must never be imported into a Vite application.
