# Database rules

## Source of truth

Nuede V2 uses Supabase PostgreSQL as the source of truth for business data. Browser storage is permitted only for explicitly local customer conveniences such as future favorites, carts, and meal plans; it is not a trusted commerce database.

Cycle 2 defines the initial commercial schema in `supabase/migrations/20260831000100_create_database_foundation.sql`. Cycle 3 adds authentication-aware privileges and RLS in `supabase/migrations/20260831000200_enable_auth_and_rls.sql`. Cycle 4 adds database-owned product audit events in `supabase/migrations/20260831000300_audit_admin_catalog_changes.sql` without changing the catalog entity model.

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

Cycle 5 implements the workflow rule that a grouped product cannot become orderable without a valid orderable variant.

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

## Cycle 12 atomic order creation

`20260903000200_create_secure_order_persistence.sql` adds `private.order_reference_sequence`, initialized above any existing numeric `NUE-` reference, and `public.create_order_atomic(jsonb, jsonb)`. The sequence is private and concurrency-safe; the unique `orders.order_reference` constraint remains the final collision guard.

The RPC accepts only already validated authoritative snapshots from the Edge Function. It is `SECURITY DEFINER`, uses an empty `search_path`, is executable only by `service_role`, and hard-codes initial `payment_status = 'unpaid'` and `fulfilment_status = 'pending'`. PostgreSQL treats the function call as one transaction, so an item or add-on failure rolls back the order and all earlier children. No payment row is created.

Cycle 13 reuses this exact persistence path for WhatsApp orders and requires no migration. The request's already validated method persists as `whatsapp`; the RPC still supplies `unpaid` and `pending`, and no WhatsApp URL/message column or synthetic payment record is added. Handoff text remains derivable from the permanent order response and purchase-time snapshots.

Existing snapshot columns are reused without duplicating the Cycle 2 model. `orders` retains customer/delivery/zone/fee/totals/nutrition and plan dates; `order_items` retains product/variant names, base price, quantity, configured line total/nutrition, and schedule address; `order_item_addons` retains each add-on's purchase-time name, price, and nutrition.

## Updated timestamps

One minimal migration-defined `set_updated_at()` helper is applied only to mutable lifecycle records. Immutable snapshots, feedback, assignments, and audit rows retain creation timestamps without a misleading update lifecycle.

## Security boundary

Cycle 3 enables RLS on all fifteen business tables and replaces project-dependent defaults with explicit `anon`, `authenticated`, and `service_role` grants.

Public predicates are:

- enabled categories;
- products other than `hidden` or `archived`;
- non-hidden variants whose parent is public;
- available add-ons and assignments joining public products to available add-ons;
- active delivery zones;
- published testimonials;
- the two-column `checkout_payment_options` view.

Anonymous feedback insert is the only public table write. Feedback reads, administrator data, orders, item snapshots, payments, audit records, and checkout metadata require an active administrator. Direct client writes to trusted commerce state remain denied.

The private `is_active_admin()` helper reads only the caller's own trusted authorization state. The checkout projection is deliberately privileged but exposes no singleton/admin metadata. Cycle 2 trigger-function execution is revoked from public client roles.

The schema is implemented, not yet verified or accepted. Cycle 2 reset verification was explicitly skipped; a full migration replay and security suite remain required review evidence.

## Cycle 4 catalog persistence

Cycle 4 uses the existing category columns (`name`, `slug`, `is_enabled`, and non-negative `sort_order`) and the existing standard-product columns. No new product state, visibility flag, or money column was added.

Admin product writes continue through the browser-safe anon client under an authenticated active-admin session. RLS authorizes the write; database constraints enforce product type, state, price, and nutrition integrity. Category disablement changes only `categories.is_enabled` and never rewrites or deletes related products.

The Cycle 4 audit trigger records active-admin product creation, general edits, price changes, status changes, archive, and restore operations. It snapshots the authenticated admin identity and relevant old/new values. The trigger is `SECURITY DEFINER` with an empty search path and is not executable as a public RPC. Authenticated clients retain read-only access to `admin_audit_log` and cannot forge audit rows.

Permanent product deletion remains outside the Cycle 4 field-guide scope. The database relationship behavior is preserved, and archive/restore is the implemented lifecycle path.

## Cycle 5 catalog completion

`20260901000100_complete_catalog_images_variants_addons.sql` configures the public `product-images` bucket with a five-megabyte limit and JPEG, PNG, WebP, and AVIF MIME allowlist. Product and variant rows store bucket-relative object paths. New admin uploads use `products/<product UUID>/<object UUID>.webp` or `variants/<variant UUID>/<object UUID>.webp`.

An available grouped parent must have at least one `available`, priced child. A protected transition trigger rejects hiding, selling out, unpricing, deleting, or moving the final valid child while its parent remains available. A configured default must be an available priced child of the same group and cannot be invalidated or removed until the parent changes its selection configuration.

`reorder_product_variants(uuid, uuid[])` accepts the exact stable child-ID set once and writes normalized sort positions atomically. `replace_product_addon_assignments(uuid, uuid[])` validates an existing product and a unique set of existing global add-ons before atomically replacing compatible relationships. Both functions require an active admin in addition to authenticated execution grants.

Cycle 5 extends trusted trigger-owned auditing to grouped-parent settings, variant lifecycle/price/status/order changes, add-on lifecycle changes, and product/add-on assignment changes. Browser roles still cannot insert audit rows.
