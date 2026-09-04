# Nuede V2 architecture

## Cycle 17 content extension

Each application owns a `features/content` boundary for its APIs, Query hooks and components. Shared input validation lives in `@nuede/validation/content`. Storefront static editorial/contact configuration remains local configuration, not a new CMS. Public testimonials use a narrow database projection; private feedback stays in the existing table under RLS. Homepage featured meals consume the established menu cache, cards, customization validation and cart provider. [Cycle 17 details](CYCLE17.md) document publication, privacy, auditing and verification limits.

## Status

This document records the architecture established in Cycle 0. Changes to frozen decisions require explicit approval before implementation.

## Repository model

Nuede V2 uses npm workspaces without a monorepo framework.

```text
apps/storefront  ─┐
                  ├──> packages/*
apps/admin       ─┘

packages/* must not depend on either application.
```

The storefront and admin are independent React/Vite applications. They have separate entry points, development servers, production builds, environment files, deployments, and domains. Sharing a repository does not make them one application.

## Directory responsibilities

- `apps/storefront` contains customer-facing presentation and feature code.
- `apps/admin` contains administrator-facing presentation and feature code.
- `packages/domain` contains framework-independent business calculations and domain rules.
- `packages/validation` contains reusable runtime validation schemas.
- `packages/config` contains public, non-secret shared constants and configuration helpers.
- `supabase/migrations` is the only source of database schema changes.
- `supabase/functions` contains trusted backend operations.
- `docs` contains durable project rules and requirement traceability.

Application-specific UI, hooks, API adapters, and state remain in the application that owns them. Shared packages are introduced only when code has a genuine cross-application or cross-boundary responsibility.

## Feature organization

When feature cycles begin, application code should be organized by feature rather than by a single repository-wide component bucket. A feature may contain its own API adapter, hooks, components, and utilities. Visual components must not scatter direct Supabase calls throughout the tree.

Shared packages must remain independent of React and application routing unless a later approved architectural decision explicitly changes that boundary.

## Cycle 1 application shells

Each application owns a separate React Router tree.

Storefront routes are `/`, `/menu`, `/saved`, `/planner`, `/checkout`, and `/payment`. The storefront root layout owns the header, desktop/mobile navigation, basket entry point, main landmark, notifications, and footer. About, FAQ, and Contact are homepage anchors until the Cycle 17 content work justifies any dedicated route.

Admin routes are `/login`, `/dashboard`, `/menu`, `/orders`, `/analytics`, `/delivery`, `/testimonials`, `/feedback`, and `/settings`. Login renders outside the operational layout. The remaining routes use the admin sidebar, top bar, mobile navigation, and content canvas. There are deliberately no auth guards in Cycle 1.

Both trees include branded Not Found behavior. `apps/*/src/app/routePaths.js` is a plain-JavaScript route manifest used for navigation and structural tests; `apps/*/src/app/router.jsx` owns rendered route composition.

## Presentation boundaries

`packages/config/src/brand.css` is the only shared visual layer. It contains stable CSS/Tailwind theme tokens and imports no application or React code.

React UI and layouts remain application-owned. Storefront and admin may use similar primitive names, but each can evolve for its distinct customer or operational context without creating a cross-deployment UI package.

Fixture data lives under each application's `src/fixtures` directory. Fixtures are not APIs, database models, seed data, or shared domain rules; their direct page imports make their temporary nature explicit.

## Authority boundaries

Supabase PostgreSQL is the source of truth for business data. React may display estimates and collect normalized input, but it is never authoritative for prices, totals, order validity, payment state, or fulfilment state.

Trusted server logic must retrieve current database values and decide:

- product, variant, and add-on validity;
- current prices and delivery fees;
- checkout payment-method availability;
- authoritative totals;
- order creation and historical snapshots;
- payment initialization and verification.

Backend code and secrets must never become browser-importable. Payment state and fulfilment state remain separate concepts.

## Cycle 2 database foundation

The initial commercial schema is an atomic Supabase migration under `supabase/migrations`. A disposable local database is recreated entirely from migrations plus `supabase/seed.sql`; no required object may exist only in a Supabase Dashboard.

The schema establishes normalized catalog relationships, configurable delivery and checkout records, trusted-admin storage, immutable commerce snapshot capacity, payment history, customer content, and administrative auditing. The presence of these tables does not implement the later workflows that will populate or expose them.

Authoritative product, variant, add-on, delivery, order, and payment values remain in PostgreSQL. Future Edge Functions will re-read those values and populate immutable order snapshots. React must not calculate or write an authoritative total.

Cycle 2 stores image object paths only. Supabase Storage bucket creation and upload management remain Cycle 5 work.

## Cycle 3 authentication and authorization

The admin application owns one Supabase browser client at `apps/admin/src/lib/supabaseClient.js`. It reads only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Auth API calls, session state, authorization checks, and route gates live under `apps/admin/src/features/auth`; visual pages do not create clients or implement token storage.

`AuthProvider` resolves the server-validated Supabase identity, subscribes to supported Auth state changes, and queries the caller's own `admin_users` row. Protected content renders only after both authentication and active-admin authorization succeed. The `/login` route is public-only; every operational route is nested under `ProtectedRoute`.

The route guard is a presentation boundary. PostgreSQL grants and RLS enforce public, authenticated non-admin, inactive-admin, active-admin, and trusted-backend behavior when the frontend is bypassed.

The storefront remains fixture-backed in Cycle 3. Public RLS is ready for its later data cycle, but no storefront Supabase query layer exists yet.

## Cycle 4 admin catalog management

The admin `/menu` route replaces its fixture table with a feature-scoped catalog implementation under `apps/admin/src/features/catalog`. Supabase operations live only in the feature API adapter, while TanStack Query owns catalog loading, caching, mutation state, and invalidation. Product and category visual components do not create clients or issue raw database calls.

The standard-product editor uses React Hook Form and the shared Zod schema exported by `@nuede/validation/catalog`. NGN text is converted deterministically to integer kobo before it reaches the API adapter; `@nuede/domain/currency` formats existing integer-kobo values without making React authoritative for price.

Cycle 4 uses the existing single `products.status` model rather than adding contradictory visibility flags. The form presents availability and visibility concepts, then maps them to the constrained database state. Restoring an archived product returns it to `hidden` so restoration does not publish it accidentally.

`apps/admin/src/lib/queryClient.js` configures the application query cache. Auth logout clears cached administrator data, and inactive query data is discarded when protected routes unmount. The menu route is lazy-loaded so its form/query dependencies do not inflate the initial admin shell.

Product audit events are created by a narrowly scoped PostgreSQL trigger, not by browser-written audit rows. The Cycle 3 catalog RLS policies remain the write authorization boundary.

## Cycle 5 images, variants, and add-ons

Cycle 5 extends the existing catalog feature instead of introducing another data path. `catalogApi.js` owns product, variant, add-on, assignment, and reorder operations; `imageApi.js` is the only browser module that calls Supabase Storage. TanStack Query invalidates the shared catalog keys after mutations, while React Hook Form and the shared Zod schemas validate standard-product, grouped-parent, variant, and add-on inputs.

The `product-images` bucket is public for project-independent storefront-safe reads and accepts writes only from authenticated active admins. PostgreSQL stores object paths, never binaries or project URLs. New images are validated and optimized in the browser, uploaded under UUID ownership directories, committed to the database, and only then replace the prior object. Failed persistence compensates by removing the newly uploaded object.

Grouped parents remain unpriced families. Variants own their stable UUID, price, nutrition, image, status, and sort order. PostgreSQL triggers prevent an available group from having zero orderable variants, prevent invalidating the configured default, and prevent moving a stable variant to another group. Atomic database functions reorder an exact child set and replace a product's compatible add-on set.

The admin menu now manages standard meals, grouped parents, variants, and reusable add-ons. It does not query from the storefront, provide customer variant/add-on selection, or implement any Cycle 6+ behavior.

## Cycle 6 live storefront menu

The storefront `/menu` route consumes the catalog through `apps/storefront/src/features/menu`. Raw Supabase operations are confined to `api/menuApi.js`; visual components consume normalized products through TanStack Query hooks. The public product query uses the existing anonymous RLS boundary, an enabled-category inner relationship, and a single embedded variant relationship to avoid N+1 reads. Hidden and archived states are excluded both by RLS and by the explicit public query contract.

`menuModel.js` is the shared menu-level selector for standard/grouped state, variant-derived orderability, display pricing, representative nutrition, and composed search/filter behavior. Grouped products remain variant-aware without exposing Cycle 7 selection or customization behavior. Storage paths are converted to public `product-images` URLs in the API layer; card components own only loading and fallback presentation.

The storefront query client caches categories and products under stable `storefront-menu` keys. One lifecycle-owned channel listens only to `categories`, `products`, and `product_variants`, then invalidates the affected query keys. A 60-second active-page refetch and window-focus refetch provide recovery when a connection or row-visibility transition prevents a Realtime event from reaching the anonymous client. The Cycle 6 migration adds only these tables to `supabase_realtime`; existing grants and RLS remain unchanged.

## Cycle 7 product details and customization

Cycle 7 extends the existing `/menu` query rather than introducing a detail-query path. The single product read embeds public variants and product-level add-on assignments; `menuModel.js` converts raw relationships, Storage paths, money, nutrition, selection mode, and stable IDs into the storefront model. Realtime invalidation also covers add-ons and assignments so an open detail view receives the same TanStack Query updates as the menu.

`apps/storefront/src/features/product-detail` separates visual controls, React state reconciliation, and reusable domain calculations. The state layer initializes only a valid configured default, never selects the first variant for an explicit-choice group, removes selections made invalid by refreshed catalog data, and revalidates at the output boundary. Hidden variants are omitted; sold-out/unavailable variants remain non-orderable; add-ons are limited to the product's existing assignments.

`@nuede/validation/customization` validates the structural configuration identity, while `customizationModel.js` validates current catalog membership and orderability. A valid output contains only `{ productId, variantId, addonIds, quantity }`. Display price and item-level nutrition are derived separately; integer-kobo estimates and partial-nutrition flags never become trusted checkout input. The dialog emits this object through `onConfigured` but intentionally adds no cart store, persistence, merging, subtotal, planner, or favorites behavior.

The existing native-dialog primitive now supports a large responsive mode and restores focus even when the owning detail component unmounts. Native modal behavior supplies background inertness and focus containment; the detail UI adds labelled radio buttons, checkboxes, quantity controls, textual state labels, Escape closing, image fallback, mobile full-screen layout, and desktop columns.

## Cycle 8 nutrition engine and Saved Meals

`@nuede/domain/nutrition` is the only nutrition arithmetic and formatting authority. Domain inputs use `calories`, `proteinG`, `carbohydratesG`, and `fatG`; results preserve each known value plus field-level completeness, `hasAny`, `isComplete`, and a machine-readable `complete`, `partial`, or `unavailable` status. Missing values stay `null`. Configured items choose the variant instead of the grouped parent, add each selected add-on once, and multiply the complete configured unit by quantity. Generic aggregation feeds the cart-style adapter, while the meal-plan adapter flattens days/slots and divides totals by explicit plan duration. Neither adapter introduces cart or planner state.

Cycle 7's `customizationModel.js` remains the catalog-selection adapter but delegates all nutrition arithmetic to the shared engine. Menu normalization uses the same completeness rules, and card/detail formatting uses the same edge formatter. The engine is framework-independent, deterministic, and contains no Supabase or browser imports.

`apps/storefront/src/features/saved-meals` owns account-free favorites. The only persisted representation is a validated, deduplicated array of product UUIDs under `nuede:v2:saved-meals`; no product snapshot, price, image, nutrition, or configuration is stored. `SavedMealsProvider` owns active-tab state and listens for browser `storage` events. Menu cards and product details consume one accessible favorite control, while `/saved` intersects local IDs with the existing public `useMenu()` result. Consequently hidden, archived, deleted, disabled-category, and invalid IDs cannot disclose catalog data; sold-out and price-pending meals retain their current public state. Clear All uses the existing native-dialog confirmation pattern.

## Cycle 9 anonymous shopping cart

`@nuede/domain/cart` owns canonical add-on ordering, configuration identity, deterministic immutable cart operations, quantity rules, duplicate merging, replacement, and item-count aggregation. Configuration identity is exactly the JSON tuple `[productId, variantId, sortedUniqueAddonIds]`; quantity is state on that identity, never part of it. `@nuede/validation/cart` validates the versioned browser payload and each stable catalog reference.

`apps/storefront/src/features/cart` owns the React provider, storage adapter, live-catalog hydration, and basket dialog. The only persisted data under `nuede:v2:cart` is `{ version: 1, items: [{ productId, variantId, addonIds, quantity }] }`. Stored lines are untrusted, structurally validated, canonicalized, and merged on restoration. Names, images, prices, availability, compatibility, and nutrition are never persisted; the cart resolves them through the existing public TanStack Query menu cache.

Missing public products render a generic removable line without exposing stale details. Current sold-out, price-pending, unavailable, invalid-variant, and invalid-add-on configurations remain visible and block checkout readiness. Display-only integer-kobo prices and subtotals are derived from current public catalog values, exclude invalid lines, and are explicitly non-authoritative. Delivery is not invented before checkout. Cart nutrition delegates to the Cycle 8 engine and preserves partial/unavailable completeness. The native dialog supplies Escape, focus containment/restoration, and responsive full-screen mobile behavior; the provider supplies same-tab updates and lightweight cross-tab `storage` synchronization.

## Cycle 12 server-authoritative order engine

`supabase/functions/create-order` is the guest-checkout HTTP adapter. It owns only Edge-runtime setup, POST/OPTIONS handling, JSON parsing, safe response formatting, and creation of the backend-only Supabase client. Reusable commerce work lives under `supabase/functions/_shared/order` as a linear pipeline:

```text
strict Cycle 11 request -> flatten selections -> batched current-state reads
-> relationship/availability checks -> integer-kobo price + nutrition
-> immutable snapshots -> one atomic PostgreSQL RPC -> authoritative response
```

The Zod request boundary is re-exported from the accepted shared validation package so browser and server shapes cannot drift. Financial, nutrition, display, and availability fields are not part of the contract. The data loader batches unique stable IDs and uses the service role only in the Edge runtime so hidden/unavailable rows can be distinguished safely without broadening public catalog reads.

The pure pricing/snapshot layers select a standard product or grouped variant as the base exactly once, add each compatible available add-on once, multiply by validated quantity, and add one current delivery-zone fee per order. The runtime-neutral Cycle 8 nutrition engine applies the same base/add-on/quantity semantics and preserves missing values.

`create_order_atomic` is deliberately persistence-only rather than a second pricing API. Its only caller is `service_role`; it generates a private-sequence reference, hard-codes safe initial statuses, and inserts the order, item, and add-on snapshots in one database transaction. Cycles 13 and 14 can call the same shared engine before their method-specific behavior without copying pricing logic.

## Cycle 13 WhatsApp handoff

`supabase/functions/create-whatsapp-order` is the method-specific orchestration boundary. It rejects non-WhatsApp contracts, validates the backend-only `NUEDE_WHATSAPP_NUMBER`, and calls the unchanged Cycle 12 `createAuthoritativeOrder` pipeline. Current WhatsApp enablement therefore remains part of the same server-side settings read that gates persistence.

Only the returned authoritative order response feeds `_shared/whatsapp.js`. The formatter uses the permanent reference, customer/delivery snapshot, item/variant/add-on snapshots, meal-plan schedule, and server totals, then encodes that deterministic text into an HTTPS `wa.me` URL. The browser receives no ability to choose a recipient, message, price, status, or order reference.

```text
selection-only checkout contract -> WhatsApp method pin -> Cycle 12 authoritative engine
-> permanent unpaid/pending order -> server snapshot formatter -> encoded handoff
-> separate storefront order-created state -> automatic open / same-URL manual retry
```

Cart or planner state is cleared only after the permanent response and never owns the retry URL. An unexpected formatter failure does not undo persistence; the server returns a minimal reference/status recovery payload. A network failure with no response remains intentionally ambiguous and is not automatically retried because no general idempotency key exists yet.

## Cycle 14 secure Paystack payments

`initialize-paystack` is the method-specific Paystack boundary. It pins `paymentMethod = 'paystack'`, reuses the Cycle 12 request validation/catalog/settings/pricing/nutrition/snapshot pipeline, and substitutes only a Paystack-specific atomic persistence function. The database creates the permanent order and pending payment attempt together before the backend calls Paystack with the trusted integer-kobo total and configured callback URL.

```text
selection-only checkout -> shared authoritative engine -> atomic order + payment attempt
-> backend Paystack initialization -> hosted checkout -> /payment?reference=...
-> trusted lookup -> Paystack verification and/or signed webhook
-> atomic payment + order payment-status reconciliation
```

`paystack-webhook` authenticates the original request bytes with the official HMAC SHA-512 `x-paystack-signature` protocol before JSON parsing or any write. `verify-paystack-payment` treats a redirect reference only as a lookup key and calls Paystack server-to-server for known non-terminal attempts. Both paths converge on the same row-locking RPC, which verifies stored expected amount and NGN currency, records controlled integrity failures, is idempotent for an already verified payment, and never changes fulfilment status.

The result page fetches through one feature API/hook, performs at most six automatic refreshes, and renders confirming, successful, pending, and failed states. Only a verified database result can render success or provide the post-payment WhatsApp message. That message is independent of whether manual WhatsApp checkout remains enabled.

## Cycle 16 first-party sales analytics

Cycle 16 keeps business aggregation in PostgreSQL. `private.analytics_eligible_sales` is the canonical one-row-per-order relation: a Paystack order must be `paid` and have at least one exact-amount, NGN, `paid` plus `verified` payment record. A lateral `min(verified_at)` selection makes the payment date deterministic and prevents multiple attempts or webhook/reconciliation history from multiplying the order.

The private `daily_sales`, `product_sales`, `variant_sales`, `addon_sales`, `delivery_zone_sales`, and `payment_method_sales` views preserve purchase-time snapshot grain. `public.get_admin_sales_analytics(date,date)` is the sole browser query boundary. It checks `private.is_active_admin()`, applies one inclusive business-date range to every aggregate, fills missing days with zero buckets, and returns exact money fields as integer-kobo text. No PII or raw order/payment rows are returned.

```text
verified payment + paid order -> one eligible sale -> private snapshot aggregates
-> active-admin range RPC -> one TanStack Query payload
-> exact KPI text + responsive Recharts/table views
```

The business reporting timezone is `Africa/Lagos`; persistence stays `timestamptz`/UTC. Revenue recognition and daily buckets use the trusted `payments.verified_at` instant converted to the Lagos date. The dashboard and Analytics page share the same query key and five-minute cache policy. The browser only converts aggregate values to numbers for chart geometry; exact displayed amounts continue through the shared integer-kobo formatter.

## Frozen technology decisions

- JavaScript and JSX only; no TypeScript.
- React, Vite, and Tailwind CSS v4 for both frontends.
- Supabase PostgreSQL, Auth, Storage, Realtime, and Edge Functions for the backend.
- Paystack hosted checkout for online payments.
- Vercel for two independent frontend deployments.
- Integer kobo for authoritative monetary values.
- Zod plus database constraints for important runtime and persistence boundaries.
- TanStack Query, React Hook Form, Recharts, and Lucide React when their approved cycles need them.
- No V1 migration and no customer accounts at V2 launch.

## Prohibited drift

Do not introduce TypeScript, Firebase, Next.js, Express, another backend/database/payment provider, customer accounts, subscriptions, loyalty, AI recommendations, or a monorepo/state/server framework without explicit approval.

Do not place authoritative pricing in React, expose backend secrets through Vite, permit direct public authoritative order/payment mutation, or build a later cycle early.
