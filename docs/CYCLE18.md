# Cycle 18 — security, QA, deployment and launch evidence

Recorded 2026-09-04. **BLOCKED.** Implementation and local QA progressed without a pre-flight approval gate. The configured hosted backend has known schema/function mismatches and the required complete deployed payment proof has not run. Cycles 0–17 remain the accepted foundation. There is no Cycle 19.

## 1. Cycle 18 summary

- Added database enforcement of enabled payment methods at order insertion, including the WhatsApp settings race and generic order-creation bypass. Existing payment reconciliation remains possible after checkout is disabled.
- Restricted payment-setting changes to active owner/admin, made attribution server-controlled, and audited actual flag changes. Editors receive a read-only settings screen.
- Bounded actual request-stream bytes on every commerce endpoint: 128 KiB JSON and 1 MiB webhook; extended Paystack timeout protection through response-body reading.
- Added public-environment validation and source/build secret scanning, independent Vercel app configurations, SPA routing and security/privacy headers.
- Cleared admin query data when identity or authorization changes. Failed analytics no longer masquerade as zero revenue.
- Completed documented dashboard recent orders, operational order counts, and verified cart-versus-meal-plan analytics within existing modules.
- Fixed narrow-screen carousel overflow, mobile logout semantics, notification regions, keyboard access to scrollable tables, and populated-chart accessibility. Exact revenue is available in the screen-reader trend table.
- Split planner, checkout, payment and analytics routes to reduce initial JavaScript. Architecture remains JavaScript, React/Vite, separate apps and Supabase/Paystack authority.

## 2. Important files

| Area | Files |
|---|---|
| Database hardening | `supabase/migrations/20260904000200_harden_checkout_method_races.sql`, `supabase/tests/database/012_cycle18_security.test.sql` |
| Analytics completion | `supabase/migrations/20260904000300_complete_launch_analytics.sql`, `supabase/tests/database/010_cycle16_sales_analytics.test.sql`, `OrderActivitySummary.jsx`, `RecentOrders.jsx`, dashboard/analytics pages |
| Edge boundaries | `_shared/requestBody.js`, order/Paystack persistence and provider client, all five function handlers |
| Frontend security | `AuthContext.jsx`, `SettingsPage.jsx`, `scripts/public-environment.js`, both Vite configurations and `.env.example` files |
| Deployment | Both app `vercel.json` files, `supabase/functions/.env.example`, `supabase/verification/launch-readiness.sql`, `docs/DEPLOYMENT.md` |
| QA | `scripts/verify-cycle18-browser.mjs`, `scripts/verify-cycle18-security.test.js`, `scripts/verify-cycle18-secrets.mjs`, `scripts/audit-hosted-public.mjs`, npm lockfile/scripts |
| Documentation | This report, `FEATURE-MATRIX.md`, `TRACEABILITY.md`, README, architecture/security/database/development/features documentation and migration README |

## 3. Security attack results

Statuses below name their evidence boundary. Node tests include domain execution, mocked handler dependencies and source-contract assertions. They do not execute PostgreSQL RLS or provider transactions.

| Attack | Result and evidence |
|---|---|
| Unauthorized admin | PASS for logged-out private-route redirects and mocked expired/inactive/non-admin guards; hosted anonymous admin/private-data reads denied. Real authenticated cross-role database tests NOT RUN. |
| Anonymous product/price edits | PASS for hosted 401 responses to nonexistent-ID product, variant, add-on and delivery-fee writes. No actual business row was modified; real-row policy tests NOT RUN. |
| Fake prices | PASS in authoritative order-engine/schema regressions: browser money cannot override catalog/variant/add-on/delivery prices. Hosted creation NOT RUN. |
| Fake variants | PASS in executable validation for invalid, mismatched, hidden and sold-out selections. Hosted execution NOT RUN. |
| Fake add-ons | PASS in executable duplicate, incompatible and unavailable add-on validation. Hosted execution NOT RUN. |
| Invalid delivery zone / manipulated total | PASS in order/checkout validation and repricing tests. Browser journeys send IDs without price authority. Hosted execution NOT RUN. |
| Disabled payment methods | PASS in handler rejection and database-error mapping tests; insertion-time lock/trigger and role tests added. PostgreSQL execution/concurrency NOT RUN. |
| Fake payment success | PASS in invalid-signature handler tests and forged browser callback UI; real webhook probe FAIL because the configured function endpoint returns 404. |
| Repeated webhook | PASS in mocked duplicate/no-op handler contract. Actual atomic reconciliation, concurrent/replayed deliveries and revenue deduplication NOT RUN against PostgreSQL/provider. |
| Wrong amount / currency | PASS in existing reconciliation source-contract checks; executable database/provider rejection NOT RUN. This is not a claim of a verified real payment. |
| Private feedback | PASS: hosted anonymous feedback SELECT/UPDATE probes denied; mocked content suite preserves private source and handles feedback validation/errors. Authenticated private-feedback RLS NOT RUN. |
| Unauthorized testimonial management | PASS: hosted anonymous write probe denied. FAIL: base testimonial SELECT still succeeds on the configured backend, contrary to the current four-field public-view boundary. The expected safe view returns 404. |
| Unauthorized fulfilment / historical snapshots | PASS in transition/domain and migration-contract tests; anonymous order/item updates denied on hosted nonexistent-ID probes. Real RPC/row tests NOT RUN. |
| Analytics access | PASS in source guard checks; hosted authorization probe FAIL to establish the intended guard because the RPC returns PGRST202 with valid arguments. No private analytics data was returned. |
| Cross-role settings | PASS in mocked editor UI. SQL owner/admin/editor/inactive, forged attribution, audit and last-method tests added; execution NOT RUN. |
| Frontend secrets | PASS in build guard tests and final source/untracked/build pattern scan. No tracked real environment files. This does not audit remote secrets or Git history. |

Hosted audit: **25 probes, 19 PASS, 6 FAIL**. Failures: published view missing, base testimonial metadata boundary, both admin RPCs unavailable, webhook endpoint unavailable, verification endpoint unavailable. A 404 is not successful authorization/payment verification. No PII or credentials are printed by the audit. Its write probes target the all-zero nonexistent ID and prove grants only.

## 4. End-to-end results

| Journey | Local mocked UI | Actual deployed journey |
|---|---|---|
| Standard meal → WhatsApp | PASS: 1,000,000 kobo, unpaid, Delivered | NOT RUN |
| Standard meal → Paystack | PASS: 1,000,000 kobo, fixture paid, Delivered | NOT RUN |
| Grouped meal → variant → two add-ons → Paystack | PASS: 1,300,000 kobo, fixture paid, Delivered | NOT RUN |
| Meal plan → WhatsApp | PASS: 2,100,000 kobo, scheduled snapshots, unpaid, Delivered | NOT RUN |
| Meal plan → Paystack | PASS: 2,100,000 kobo, scheduled snapshots, fixture paid, Delivered | NOT RUN |

The browser drives the real React apps and authoritative order engine with mocked catalog/persistence/provider dependencies. Payment completion is an explicit fixture transition, not a real charge. Refresh persistence, selection, delivery, callback state, order display and forward fulfilment are exercised.

## 5. Responsive QA

Checked 320, 390, 768, 1024 and 1440 CSS-pixel widths in installed Microsoft Edge, covering storefront home/menu/saved/planner/checkout/payment and admin dashboard/menu/orders/order detail/analytics/delivery/testimonials/feedback/settings. These are emulated viewports, not physical devices.

The narrow homepage overflow came from offscreen carousel content; positioning the scroll track contains it. Admin long identity text and icon-only logout were corrected. The final 104-check run passed with no horizontal overflow, including grouped dialogs at 320/390 and populated grouped/meal-plan checkouts at all five widths. Safari, Firefox and physical-device verification remain NOT RUN.

## 6. Accessibility QA

The Cycle 17 content browser suite passed keyboard FAQ/carousel interactions, editor focus restoration, form validation, feedback status/error handling, publication retry and mobile dialogs. Cycle 18 uses axe WCAG 2 A/AA and 2.1 AA on small/large route states and purchase flows. It fixed labelled notification semantics, keyboard scrollports and focusable Recharts content inside `aria-hidden` containers. Equivalent tabular/list data remains available, including exact kobo-derived revenue formatting.

The final full run reports zero axe violations and zero uncaught browser errors. Automated accessibility checks are not a manual screen-reader certification. Manual NVDA/VoiceOver and every native touch/browser combination are NOT RUN.

## 7. Database / RLS

The repository contains **14 ordered migrations through `20260904000300`**. Existing applied migration files were not rewritten. New hardening uses private, postgres-owned functions with an empty search path, revoked public execution, narrow authenticated permission-helper access, and existing constrained/audited tables. The method check locks the singleton row during insertion; a rejected transaction leaves no new order. It does not change payment or historical snapshot authority.

The analytics extension preserves the existing canonical eligible-sale relation and guarded RPC. Operational counts use order creation dates in Africa/Lagos; sales use verified payment dates. These populations are deliberately described separately in the UI. Five assertions extend the existing analytics fixture; the new SQL security file checks role, actor, audit, insertion and last-enabled-method behavior.

Local PostgreSQL migration reset and pgTAP execution are **NOT RUN**: neither Docker nor Podman is installed. Work continued with available tests; this was not a pre-flight gate. Hosted migration history, actual policy execution, concurrent locks, storage authorization and SQL reproducibility remain unverified without authenticated backend access. The read-only `launch-readiness.sql` is prepared but NOT RUN.

## 8. Production Supabase

Both ignored local frontend environments point to `https://akerwoivvdcrdelguwdb.supabase.co`; the user has not confirmed its production designation. Public connectivity succeeds for categories, products, delivery zones and payment options. The audit confirms a mismatch with the current application contracts: published testimonials and the two current admin RPCs are unavailable, and checked payment endpoints return 404. Base testimonial reads still succeed and expose metadata fields outside the approved public projection.

No migrations, functions, secrets, owner accounts, Auth redirects or storage settings were changed on the hosted project. `supabase projects list` reports no access token; local status reports no container runtime and no linked project. Production URL/owner/business settings and authenticated deployment access remain required. No service credential was read into output or exposed to a frontend.

## 9. Vercel storefront

Prepared `apps/storefront/vercel.json`: independent Vite build, root install, dist output, SPA fallback, CSP, no-referrer, frame denial, MIME and permissions headers. Root must be `apps/storefront`, Node 24, with outside-root sources enabled. Local production build PASS. Actual V2 deployment, domain, asset/header/deep-link verification: **NOT RUN**.

## 10. Vercel admin

Prepared the independent admin configuration with the same build/privacy controls and noindex. Root must be `apps/admin`. Local production build PASS. Actual V2 deployment/domain/Auth verification: **NOT RUN**.

The connected Vercel team was inspected. Its only listed project, `nuede-2`, is linked to **IniobongP-O/Nuede-2**, while this repository is **IniobongP-O/Nuede-V2**. Its old READY deployment is not V2 evidence and was not altered. The connector's read access works; this is not a claim that Vercel itself is unreachable. Two V2 deployments remain dependent on intended backend/domain/environment configuration and completion of launch gates.

## 11. Paystack

- Environment used: local fixtures only. Real test/live mode not configured or asserted.
- Initialization: PASS in handler/provider-client mocks, server-authoritative amount and safe hosted-URL checks. Real initialization NOT RUN.
- Webhook/signature: PASS for HMAC/invalid-event handler tests, bounded raw text and unauthenticated rejection. Hosted webhook availability FAIL (404).
- Amount/currency and idempotency: existing atomic SQL contracts retained; actual PostgreSQL/provider execution NOT RUN.
- Callback/result: server-configured storefront callback and forged-success UI tested with mocks; deployed callback and provider dashboard configuration NOT RUN.
- Backend timeout includes body reading. Credentials must be configured through secure backend settings; none were invented or printed.

## 12. Production data / content

Public data endpoints are reachable, but this is not approval of their values. Intended production owner, genuine menu/prices/variants/add-ons/nutrition/images, delivery fees, contact details, hours, testimonials and payment flags are not business-validated. No development seed was pushed and no business value was invented. Real image upload/replacement/storage-policy checks remain NOT RUN. The runbook explicitly prohibits seeding production from `supabase/seed.sql`.

## 13. Analytics reconciliation

Mocked purchase evidence: three paid fixture orders total **4,400,000 kobo (₦44,000)**: standard ₦10,000 + grouped ₦13,000 + plan ₦21,000. Two unpaid WhatsApp orders contribute no fixture revenue even when Delivered. All five retain separate payment and fulfilment states.

This reconciles the UI fixture and authoritative order-engine results, not a live database. The SQL analytics fixture expects two canonical verified orders totaling 3,000,000 kobo despite duplicate payment evidence; it also checks pending/failed/unpaid exclusion, old prices, quantities, time-zone dates and type breakdowns. That SQL test is **NOT RUN** here. Real database-to-admin reconciliation is **NOT RUN**.

## 14. Final completion test

| Production handoff | Result |
|---|---|
| Customer | NOT RUN |
| Product | NOT RUN |
| Cart | NOT RUN |
| Checkout | NOT RUN |
| Paystack | NOT RUN |
| Payment verified | NOT RUN |
| Admin sees same order | NOT RUN |
| Analytics records verified sale | NOT RUN |
| Delivered | NOT RUN |

**FINAL LAUNCH PROOF NOT RUN.** Local fixture success is recorded separately in section 4 and must not be substituted for any production handoff.

## 15. Commands and tool results

Run from repository root unless stated otherwise. Redirected outputs below are local ignored evidence under `coverage/`.

| Command / operation | Result |
|---|---|
| `node --version`; `npm --version` | PASS: v24.19.0 / 11.17.0 |
| `git status --short`; `git branch --show-current`; `git remote -v` | PASS: main, Nuede-V2 remote, initial clean tree |
| `npm test` | PASS: baseline 162; final 172/172, no skipped tests |
| `npm run lint` | PASS, zero warnings |
| `npm run build:storefront`; `npm run build:admin` | PASS after sandbox filesystem restriction was resolved through reviewed escalation |
| `npm run build` | PASS on final source, both app builds |
| `npm install --save-dev @playwright/test @axe-core/playwright` | PASS; lockfile updated |
| `node scripts/verify-cycle17-browser.mjs` | PASS using bundled modules via `NUEDE_BROWSER_MODULES` and installed Edge; mocked content/auth/data |
| `$env:NUEDE_BROWSER_PHASE='layout'; npm run test:browser:cycle18` | PASS: 77 diagnostic checks after overflow/scrollport fixes; excludes commerce journeys |
| `npm run test:browser:cycle18` | PASS: 104 UI checks, five journeys, five widths, zero axe/overflow/runtime failures. Earlier populated-chart ARIA failures corrected. |
| `npm run test:secrets` | PASS for source, untracked source and both built apps; no credential patterns or real tracked env files |
| `npm audit --omit=dev --json` | PASS: zero reported production dependency vulnerabilities |
| `git -c core.autocrlf=false diff --check` | PASS |
| `npx --no-install supabase status` | BLOCKED: Docker/Podman absent; no linked local project |
| `npx --no-install supabase projects list` | BLOCKED: no Supabase access token |
| `node scripts/audit-hosted-public.mjs` | FAIL as a readiness gate: 19/25 pass, six hosted contract failures; repeated with valid RPC parameters |
| Vercel `list_teams`, `list_projects`, `get_project` | PASS read-only inventory; only a different repository's project found |
| `npm run db:reset`; `npm run db:test` | NOT RUN: no local PostgreSQL container runtime |
| `npm run test:security:cycle3`; `npm run test:catalog:cycle4`; `npm run test:catalog:cycle5` | NOT RUN: require the unavailable local Supabase fixture backend |
| Hosted migration push, all five Edge deploys, launch-readiness SQL, V2 Vercel deploys | NOT RUN: intended production configuration/access and verified backend prerequisites outstanding |

Routine file reads/searches, PDF extraction and capability discovery are not acceptance tests. Earlier browser harness selector failures were corrected; any product defect found by those runs is listed in section 1. No failed test was converted into successful live evidence.

Final local rerun: **PASS — 172 Node tests, lint, both production builds, 104 browser checks and secret scan.** Local logs: `coverage/cycle18-final-tests.log`, `coverage/cycle18-final-build.log`, `coverage/cycle18-final-browser.log`, `coverage/cycle18-content-browser.log`, `coverage/cycle18-hosted-audit.log`; machine-readable UI and public-host audit evidence under `coverage/cycle18/`. These local artifacts are ignored; this report preserves the durable result and scope.

## 16. Unrun / blocked verification

Missing Supabase authentication/confirmed production target prevents applying the known missing backend contracts and checking real owner/role/storage policies. Missing Paystack configuration prevents real initialization, webhook delivery, signature/amount/replay/concurrency and final payment proof. Two intended V2 Vercel targets/domains/environments are not configured. Local SQL tests cannot execute without Docker/Podman. Real production content and recovery/backup settings require the intended project's operator context.

No rollback was attempted: nothing was deployed or migrated. The runbook provides migration dry-run, backup, deployment, proof and recovery steps without exposing secrets.

## 17. Remaining issues

| Severity | Issue |
|---|---|
| CRITICAL — blocks launch | Configured backend lacks checked payment endpoints/current RPC contracts, so the current architecture cannot complete the required launch flow. No real complete payment-to-Delivered proof exists. |
| HIGH — should block launch | Hosted public testimonial metadata boundary differs from the approved projection; apply/verify Cycle 17 privacy migration before launch. |
| HIGH — should block launch | New SQL migrations and role/concurrency tests have not executed against PostgreSQL. Production owner/Auth/Storage/secrets/data, two V2 deployments and business values remain unverified. |
| MEDIUM | Initial app chunks still exceed Vite's 500 kB advisory: storefront approximately 760 kB / 226 kB gzip, admin approximately 751 kB / 222 kB gzip. Lazy routes improve the baseline, but deployed mobile performance/Core Web Vitals are not measured. |
| MEDIUM | Firefox/Safari, real-device and manual screen-reader checks remain unrun; no physical-device accessibility claim. |
| LOW | Rollup reports upstream Zod annotation warnings; both production builds succeed. |

## 18. Traceability

`docs/FEATURE-MATRIX.md` maps **all 212 numbered specification requirements** to implementation responsibility and evidence boundaries. `TRACEABILITY.md`, FEATURES, ARCHITECTURE, SECURITY, DATABASE, DEVELOPMENT, README and migration documentation point to the current Cycle 18 record. Specific completion work covers recent orders, counts, cart/plan breakdown, settings permission/audit and final backend hardening. Future-readiness requirements 208–212 did not introduce new launch scope.

Mapped implementation is not blanket live acceptance. Existing tests, new local tests and unexecuted SQL/production gates are distinguished explicitly.

## 19. Git status

Branch: `main`. Changes are unstaged; no commit, tag or deployment was created. Final exact modified/untracked file inventory is captured in `docs/CYCLE18-FILES.md`. The working tree is not clean. Local `.env`, coverage/screenshots and build output remain ignored.

## 20. Final checkpoint

The final launch checkpoint is **withheld** because the known-good production state has not been established. No launch-labelled commit was created.

## 21. Launch status

**BLOCKED**

The reason is the known hosted payment/schema/privacy mismatch and missing final architecture proof, not merely a missing local tool. Use the deployment runbook to resolve these prerequisites, then rerun the actual launch chain before changing this conclusion.
