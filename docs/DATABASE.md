# Database rules

## Source of truth

Nuede V2 uses Supabase PostgreSQL as the source of truth for business data. Browser storage is permitted only for explicitly local customer conveniences such as future favorites, carts, and meal plans; it is not a trusted commerce database.

Cycle 2 defines the initial commercial schema in `supabase/migrations/20260831000100_create_database_foundation.sql`. The implementation exists but remains subject to review, objective verification, and manual acceptance.

## Schema changes

Every schema change must be represented by an ordered file in `supabase/migrations`. Undocumented dashboard-only schema changes are prohibited. A fresh environment must eventually be reproducible from migrations plus `supabase/seed.sql`.

## Money

Authoritative monetary values are stored as integer kobo. Floating-point values must not be the source of truth for prices, fees, totals, or payment amounts.

Example: NGN 6,500 is stored as `650000` kobo.

## Identifiers and history

- Business entities use stable database identifiers.
- Product and variant identifiers must remain reliable across carts, plans, orders, and analytics.
- Historical order rows snapshot the names, prices, nutrition, add-ons, and quantities that applied at purchase time.
- Menu edits must not rewrite historical orders.

## Naming and data conventions

- PostgreSQL identifiers use descriptive `snake_case` names.
- JavaScript values use `camelCase` at application boundaries.
- Timestamps are stored with timezone awareness and treated as UTC in persistence.
- Required invariants belong in database constraints as well as appropriate runtime validation.
- Archive/visibility/status fields are preferred over destructive deletion when history or relationships matter.

## Cycle 2 entity model

Catalog tables are `categories`, `products`, `product_variants`, `product_addons`, and the required many-to-many `product_addon_assignments` relationship. Delivery and administration use `delivery_zones`, `checkout_settings`, `admin_users`, and `admin_audit_log`. Commerce history uses `orders`, `order_items`, `order_item_addons`, and `payments`. Customer content uses `feedback` and `testimonials`.

## Reproducible local workflow

The project-scoped Supabase CLI and a Docker-compatible runtime rebuild the local database entirely from migrations and deterministic seed data:

```sh
npm run supabase:start
npm run db:reset
npm run db:test
```

Cycle 2 requires no linked or remote Supabase project. Applied migrations are immutable; later changes receive new timestamped files.

## Stable identifiers and seed data

Long-lived entities use PostgreSQL-generated UUID primary keys. Names and slugs are labels, not business identities. `seed.sql` uses fixed UUID literals so its relationships and verification evidence are deterministic. Order-reference generation remains trusted Cycle 12 behavior; Cycle 2 defines unique nonblank storage only.

## Nutrition

Calories are nullable integers. Protein, carbohydrates, and fat are nullable fixed-point numeric values. Every populated value must be non-negative; null means unknown rather than zero.

Catalog completeness is derived: all four values are complete, some values are partial, and all null values are unavailable. Orders retain a completeness snapshot because later catalog edits must not reinterpret historical nutrition.

## Product and variant states

Products use one constrained state instead of contradictory flags: `available`, `sold_out`, `hidden`, `archived`, `price_pending`, or `unavailable`. Variants use `available`, `sold_out`, `hidden`, or `unavailable`.

Available and sold-out standard products/variants require a price. Hidden and unavailable drafts may remain incomplete. Grouped parents derive orderable price and nutrition from variants and either require explicit selection or reference a default variant belonging to that same parent.

Cycle 5 will implement the workflow rule that a grouped product cannot become orderable without a valid orderable variant.

## Checkout-setting invariant

`checkout_settings` is a singleton. A row check prevents Paystack and WhatsApp from both being disabled; a trigger prevents the singleton from being deleted. `updated_by` is nullable so seed/reset never requires a fake admin identity.

## Historical order integrity

Orders snapshot delivery names and fees. Order items snapshot purchased product/variant names, prices, nutrition, quantity, and optional meal-plan schedule. Order-item add-ons snapshot add-on names, prices, and nutrition.

Catalog foreign keys use `SET NULL` where history must survive deletion. Snapshot columns remain authoritative. Populated orders are protected from accidental deletion by restrictive item/payment relationships. Payment and fulfilment statuses are separate, so `paid + preparing` remains valid.

## Delete behavior

- Categories are restricted while products reference them.
- Deliberate product deletion cascades only to live variants and compatibility assignments.
- Catalog and delivery deletion never deletes order snapshots.
- Orders with item/payment history are restricted from deletion.
- Auth-user deletion removes its admin profile; audit actor snapshots remain.
- Checkout settings cannot be deleted.

Archiving or deactivation is preferred over destructive catalog/delivery deletion.

## Updated timestamps

One minimal migration-defined `set_updated_at()` helper is applied only to mutable lifecycle records. Immutable snapshots, feedback, assignments, and audit rows retain creation timestamps without a misleading update lifecycle.

## Security boundary

Cycle 2 intentionally does not enable RLS or create policies. The Cycle 2-only schema is not production-secure and must not be pushed to production before Cycle 3 authorization is implemented and verified.
