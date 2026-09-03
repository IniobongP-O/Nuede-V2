# Database migrations

Every Nuede schema change must be represented by an ordered Supabase migration. Dashboard-only schema work is prohibited.

The initial commercial schema is:

```text
20260831000100_create_database_foundation.sql
```

It creates the Cycle 2 relational foundation atomically. After its checkpoint, add a new timestamped migration for every schema change; do not edit migration history that may already have been applied.

Ordered follow-up migrations:

- `20260831000200_enable_auth_and_rls.sql` adds the Cycle 3 Auth-aware grants and RLS policies.
- `20260831000300_audit_admin_catalog_changes.sql` adds the narrow Cycle 4 product audit trigger without changing catalog storage or RLS.
- `20260901000100_complete_catalog_images_variants_addons.sql` completes Cycle 5 catalog/storage rules.
- `20260901000200_enable_storefront_catalog_realtime.sql` and `20260901000300_enable_customization_catalog_realtime.sql` publish the approved live catalog tables.
- `20260903000100_enable_admin_checkout_settings.sql` permits narrowly scoped active-admin checkout-setting updates.
- `20260903000200_create_secure_order_persistence.sql` adds a private collision-safe order-reference sequence and service-role-only atomic order persistence RPC.
- `20260903000300_integrate_paystack_payments.sql` adds provider diagnostics plus service-role-only atomic Paystack order/attempt creation, initialization-failure recording, and idempotent payment/order reconciliation. Existing fulfilment state is never changed.
- `20260903000400_enable_admin_order_management.sql` adds an active-admin-only paginated order-list RPC plus a locked, forward-only fulfilment/cancellation RPC that writes the existing audit log without modifying payment state or historical snapshots.

Later RLS policies, Storage setup, analytics views, and commerce functions do not belong in the immutable Cycle 2 migration.
