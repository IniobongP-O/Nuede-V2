# Nuede V2 architecture

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

Storefront routes are `/`, `/menu`, `/saved`, `/planner`, `/checkout`, and `/payment`. The storefront root layout owns the header, desktop/mobile navigation, static basket entry point, main landmark, notifications, and footer. About, FAQ, and Contact are homepage anchors until the Cycle 17 content work justifies any dedicated route.

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
