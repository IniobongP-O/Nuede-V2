# Development guide

## Catalog image removal

Standard meals, grouped parents and variants support **Remove image** and **Undo
removal** in their editors. Removal is a draft change until saved; cancelling
discards it. Saving clears `image_path` before best-effort Storage cleanup, using
the existing authenticated adapters and policies. A rejected database write keeps
the existing object. Run `node scripts/verify-image-removal-browser.mjs` for the
mocked browser/API checks covering all three editors, cancellation, undo, pending
file removal, failed-save retry and cleanup ordering. This does not test hosted RLS.

## Post-Cycle-18 performance checks

See [the measured hardening report](PERFORMANCE.md) for results and limitations.
After `npm run verify`, run `npm run test:secrets`, `npm run test:browser:cycle18`
and `npm run test:performance`. The latter builds isolated instrumented production
apps in ignored `coverage/performance/`, reuses the Cycle 18 mocked catalog/Auth
fixtures, and measures repeated menu/editor interactions at desktop and 4× CPU
mobile sizes. Ordinary frontend builds contain no performance instrumentation.
The optional `node scripts/measure-public-performance.mjs` makes only public GET
requests to the configured backend and records sizes/timings, never row values.
No performance result substitutes for live RLS, provider or physical-device checks.

## Cycle 18 — final hardening, external launch blocked

[Current verification report](CYCLE18.md), [all 212 numbered requirements](FEATURE-MATRIX.md), and [deployment runbook](DEPLOYMENT.md) supersede historical “not begun” statements below. Cycles 0–17 remain accepted. Current hosted schema/function gaps are recorded explicitly and no final launch proof is claimed.

Run `npm run lint`, `npm test`, `npm run build`, then `npm run test:secrets`. Run `npm run test:browser:cycle18` with installed Edge (default) or `NUEDE_BROWSER_CHANNEL=chrome`. Its Supabase/Paystack/WhatsApp are explicit mocks. `NUEDE_BROWSER_PHASE=layout` is a diagnostic subset, not full journey evidence. PostgreSQL acceptance still requires the local Supabase reset/pgTAP/security/catalog commands documented in the deployment runbook. Never redirect those fixture/reset scripts at a hosted production project.


## Cycle 17 development and verification

Read [the Cycle 17 report](CYCLE17.md) for schema contracts, content configuration, tests and current infrastructure limits. Optional business contact values belong in the documented `VITE_CONTACT_*` storefront configuration; empty/invalid values do not render fake links. General WhatsApp contact is independent of checkout enablement.

Use `node --test scripts/verify-cycle17-content.test.js` for focused checks and `npm run verify` for lint, the repository suite, and both builds. `node scripts/verify-cycle17-browser.mjs` runs HTTP-mocked UI checks with Playwright, starts/cleans up isolated localhost Vite servers, and writes ignored evidence under `coverage/cycle17/`; runtime/channel overrides are documented in the report. It does not prove RLS.

When local Supabase is available, replay migrations/seed and run `npm run db:test` plus `npm run test:security:cycle3`. The new `011_cycle17_content.test.sql` checks public/private reads, allowed/forged writes, validation, active/inactive roles, conversion, publication and auditing. Those live checks were unavailable in this environment, and no hosted infrastructure or Cycle 18 deployment was provisioned.

## Local requirements

- Node.js 24
- npm 11
- Git
- Docker Desktop or another Docker-compatible container runtime for local Supabase

Install all workspaces from the repository root:

```sh
npm install
```

The lockfile is committed so clean environments can use `npm ci`.

## Development commands

```sh
npm run dev:storefront
npm run dev:admin
npm run build:storefront
npm run build:admin
npm run build
npm run lint
npm test
npm run verify
```

## Local Supabase

The Supabase CLI is an exact-version root development dependency. Run it through repository scripts so every developer uses the lockfile version.

```sh
npm run supabase:start
npm run db:reset
npm run db:test
npm run supabase:stop
```

`npm run db:reset` targets the local stack explicitly, replays `supabase/migrations`, and applies `supabase/seed.sql`. It destroys local database state and must not be replaced with `--linked` during Cycle 2.

Full Cycle 2 verification after the local stack is running:

```sh
npm run verify:cycle2
```

Do not run `supabase login`, `supabase link`, `supabase db push`, or `supabase db reset --linked` as part of the local Cycle 2 workflow.

## Cycle 3 admin Auth development

Copy `apps/admin/.env.example` to an ignored `apps/admin/.env.local` and set only:

```text
VITE_SUPABASE_URL=<local-or-approved-project-url>
VITE_SUPABASE_ANON_KEY=<public-anon-key>
```

Never add a service-role key, password, access token, or refresh token to a Vite variable. The admin build must contain browser-safe credentials only.

Public email signup is disabled in local `supabase/config.toml`. To bootstrap a manual local administrator:

1. Start local Supabase and open the local Studio URL printed by the CLI.
2. Use the local Auth administration screen to create an email/password user.
3. Copy that Auth user's UUID.
4. In local Studio SQL, insert a matching `admin_users` row with a lowercase email, optional display name, one of `owner`/`admin`/`editor`, and `is_active = true`.
5. Keep the chosen password local; never add this identity to migrations or seed data.

Cycle 3 security verification after the local stack is running:

```sh
npm run db:reset
npm run db:test
npm run test:security:cycle3
npm run verify
```

Or run the combined command:

```sh
npm run verify:cycle3
```

The direct security utility reads temporary local credentials from `supabase status -o env`, refuses non-local API URLs, creates ephemeral Auth personas, attacks RLS through Supabase clients, and removes its test records. It never writes credentials to source or a frontend environment.

## Cycle 4 catalog development

The protected `/menu` route reads categories and standard products from the configured Supabase project. Use a local active administrator created through the Cycle 3 bootstrap steps. Do not add a service-role key to the admin environment.

Cycle 4 local verification after the local stack is running:

```sh
npm run verify:cycle4
```

This resets the local database, runs every pgTAP test, reruns the Cycle 3 persona attacks, exercises category and standard-product CRUD/status/audit behavior, then runs lint, static/unit tests, and both production builds. The catalog utility refuses non-local Supabase URLs and removes its ephemeral Auth, category, product, and audit data.

Manual catalog acceptance must use the admin UI and directly inspect local PostgreSQL for category changes, the standard-product create/edit/archive/restore sequence, integer-kobo storage, and audit events. Docker Desktop or another Docker-compatible runtime is required; do not substitute a linked or production database.

## Cycle 5 catalog completion development

The admin `/menu` workspace manages standard images/add-ons plus grouped parents, variants, shared add-ons, default selection, and variant ordering. Image uploads are optimized to WebP and written to the migration-created `product-images` bucket using the authenticated browser session.

Run the complete Cycle 5 local verification after the local stack is running:

```sh
npm run supabase:start
npm run verify:cycle5
```

This resets migrations/seed, runs all pgTAP suites including Storage policies and grouped-state transitions, reruns Cycle 3 and Cycle 4 direct checks, exercises Cycle 5 grouped/variant/add-on/Storage operations and attacks, then runs lint, JavaScript tests, and both production builds. The direct utility refuses non-local Supabase URLs and cleans up its ephemeral administrator, catalog rows, audit rows, and Storage object.

Manual acceptance must still exercise valid/corrupt/unsupported/oversized image selection, persisted image replacement and cleanup, grouped creation with three independently configured variants, stable reorder IDs, default invalidation protection, shared/standard add-on relationships, responsive/keyboard behavior, and direct PostgreSQL/Storage inspection.

The storefront uses port 5173. The admin application uses port 5174. Ports are strict so a conflict is visible instead of silently changing the expected URL.

## Cycle 12 order-engine development

Cycle 12 deterministic verification does not require a browser:

```sh
node --test scripts/verify-cycle12-order-engine.test.js
npm run lint
npm test
npm run build:storefront
npm run build:admin
```

With Docker and the local Supabase stack available, apply the migration and exercise PostgreSQL security/atomicity:

```sh
npm run db:reset
npm run db:test
supabase functions serve create-order
```

The Edge runtime requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; use local or hosted function secrets and never a `VITE_` variable. Invoke `create-order` with the Cycle 11 cart or meal-plan selection contract. The storefront intentionally remains on its mock adapter until Cycle 13/14 connects method-specific completion flows.

## Cycle 14 Paystack development

Configure only Edge Function runtime values (for example through local `supabase/functions/.env` or hosted Supabase secrets):

```text
SUPABASE_URL=<Supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=<backend-only service role key>
PAYSTACK_SECRET_KEY=<Paystack test secret key>
NUEDE_STOREFRONT_URL=http://localhost:5173/
NUEDE_WHATSAPP_NUMBER=<optional international digits for verified paid follow-up>
```

Deploy/serve `initialize-paystack`, `paystack-webhook`, and `verify-paystack-payment`. Configure Paystack's webhook URL to the deployed `paystack-webhook` function. The callback URL is derived from `NUEDE_STOREFRONT_URL`; do not hard-code a production domain and do not place any Paystack secret in a Vite environment.

Deterministic verification uses mocked provider responses:

```sh
node --test scripts/verify-cycle14-paystack.test.js
npm run lint
npm test
npm run build:storefront
npm run build:admin
```

With Docker/local Supabase available, run `npm run db:reset` and `npm run db:test`, then serve all three functions and exercise Paystack test mode. Confirm success, failure/abandonment, duplicate webhook, invalid signature, wrong amount, disabled-before-init, disabled-after-init, fake redirect, unknown reference, provider outage, normal cart, and meal-plan paths. Never use production keys or real money for development acceptance.

## Cycle 16 analytics development

Run deterministic analytics coverage and both application regression builds with:

```sh
node --test scripts/verify-cycle16-sales-analytics.test.js
npm run lint
npm test
npm run build:admin
npm run build:storefront
```

With Docker/local Supabase available, `npm run db:reset` and `npm run db:test` apply the analytics migration and execute the 39-assertion `010_cycle16_sales_analytics.test.sql`. Its known dataset reconciles ₦30,000 revenue, two paid orders, ₦15,000 AOV, and five items while excluding a pending ₦50,000 order, a failed order, an unpaid WhatsApp order, and an out-of-range sale. It also covers a duplicate successful payment row, Lagos date boundary, meal-plan variant, purchased add-on, two historical zones, payment share, current-price change, zero-data range, and active/unauthorized access.

Manual acceptance requires a configured admin Supabase session and data. Compare the selected Analytics range against paid orders and verified payment timestamps in Orders; exercise Today, 7 days, 30 days, 90 days, valid/invalid custom dates, and a zero-sales range on mobile and desktop. Do not treat a missing local database runtime as a passing database test.

## Development-cycle workflow

Every cycle follows:

```text
INSPECT -> IMPLEMENT -> REVIEW -> VERIFY -> MANUAL ACCEPTANCE -> GIT CHECKPOINT
```

1. Inspect the current repository, architecture, feature sources, and relevant data boundaries without changing files.
2. Agree on a cycle-scoped plan.
3. Implement only the approved cycle.
4. Review changed code for structural, correctness, security, and scope problems.
5. Run relevant lint, tests, builds, and focused technical checks without suppressing failures.
6. Have the user perform the documented manual acceptance test.
7. Create the known-good Git checkpoint only after explicit acceptance or authorization.

A cycle is not complete merely because implementation stopped or automated checks pass.

## Engineering rules

- Use JavaScript and JSX only.
- Keep the storefront and admin independently runnable and buildable.
- Do not import application code into shared packages.
- Keep backend code out of browser bundles.
- Add dependencies only when the current cycle justifies them.
- Preserve meaningful validation and test failures.
- Prefer small feature-focused files over giant utilities.
- Do not create abstractions solely for future cycles.
- Never commit real secrets or generated build output.

## Cycle 1 frontend conventions

- Each app owns its router under `src/app/router.jsx` and its route manifest under `src/app/routePaths.js`.
- Storefront and admin must not import one another.
- Shared brand tokens are imported from `@nuede/config/brand.css`; component and page styles remain application-owned.
- Use Lucide React as the only icon source.
- Use the native `dialog` element through the application-owned `Dialog` component for modal focus containment, Escape behavior, and focus restoration.
- Form controls require visible labels. Helper/error text must be associated through `aria-describedby`.
- Reusable feedback components cover loading, error, and empty states. Toast viewports use ARIA live regions.
- Fixture content belongs under `src/fixtures` and must not be promoted into shared domain/config packages or disguised behind a fake API.
- About, FAQ, and Contact remain storefront homepage anchors until production content work.
- Commercial-looking Cycle 1 actions must be inert or explicitly describe themselves as demonstrations.

See `docs/DESIGN.md` for visual, responsive, interaction, and accessibility conventions.

## Git and recovery

Use clear Conventional Commit-style checkpoint messages from the field guide. The planned Cycle 0 checkpoint is:

```text
chore: initialize Nuede V2 architecture
```

Do not create a checkpoint until lint, builds, relevant tests, review, and manual acceptance all pass. Never build a later cycle on unresolved failures. Preserve the last known-good checkpoint rather than hiding or stacking breakage.
