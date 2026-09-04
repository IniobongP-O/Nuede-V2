# Post-Cycle-18 performance hardening

Recorded 2026-09-04. No new feature cycle, deployment, push, migration, or commit.

**Result: verified reductions in rendering work, catalog request bursts and initial admin JavaScript. Full scrolling acceptance is not established.** The reported sustained dialog slowdown was not consistently reproduced: frame timing varied substantially between repeated runs, and removing blur did not consistently improve it. Do not describe this pass as proof that the popup now scrolls materially more smoothly on the affected device.

## Baseline and method

- Branch `main`, commit `379bdba29f397f56766e35a126d75e7742d306e5`, initially clean working tree.
- Baseline lint and 184 Node tests passed. Initial build/browser attempts failed because the Windows sandbox denied esbuild parent-directory access. Reviewed reruns passed both builds and all 104 Cycle 18 browser checks. Baseline secrets scan passed.
- Existing upstream Zod annotation warnings and Vite's >500 kB entry-chunk advisory remain; neither was introduced here.
- Playwright with installed Edge/Chromium 152.0.4191.62; instrumented production builds, 1440×1000 desktop at 1× CPU and 390×844 mobile at 4× CPU. Admin uses 900-pixel height at both widths. Reduced motion enabled, same fixtures/scenario per comparison, five repetitions per case.
- Synthetic stress catalog: 120 products, a group with 12 variants/eight add-ons; admin group has 20 variants. Shared Cycle 18 catalog/Auth fixtures, mocked HTTP, 80 ms product response delay. No third-party analytics. Counters are injected by the test build plugin; ordinary production bundles contain none.
- Each run opens Choose meal, waits for an interactive dialog and a frame, scrolls 90 animation frames, selects two variants/two add-ons, increments/decrements, closes with Escape, and checks focus restoration. Counters measure component function executions, **not React Profiler commit durations**. CDP provides script/layout/task duration; traces capture paint/raster activity.
- Scrolling uses programmatic scroll offsets each frame, not physical touch input. Open timing includes browser/Playwright observation overhead and a frame. CPU throttling does not emulate a mobile GPU. Graphics inspection confirmed Intel ANGLE/D3D11 with GPU compositing enabled.
- Preserved baseline builds were rerun after the first comparison showed drift. Both sets, individual runs, traces' aggregate timings, route timings, heap observations and all asset sizes are retained in [PERFORMANCE-MEASUREMENTS.json](PERFORMANCE-MEASUREMENTS.json). Raw traces/screenshots/logs are ignored under `coverage/performance/`.

## Findings and changes

| Finding | Implementation | Evidence / boundary |
|---|---|---|
| Every dialog open executes all 120 menu cards | Shallow `memo` around `MenuProductCard`; existing stable state setter retained | 120 → 0 executions on every measured opening. No custom equality; catalog props and favorite context still update |
| Opening admin group editor rebuilds the full responsive product list | Shallow `memo` around `ProductList`, stable edit/status callbacks | One full list execution → zero; status-pending ID still invalidates the list |
| Every Realtime signal immediately refetches | Feature-owned fixed 100 ms coalescing window with category/product aggregation and teardown cancellation | Eleven signals caused 11 product requests before; 2–4 afterward depending on throttled timer spacing. Continuous edits cannot postpone the window indefinitely |
| Refresh reconciliation calls state setter during rendering | Pure reconciliation and reducer; effect commits catalog transitions; immediate derived state and every reducer action use current product | Removed/sold-out variants and unavailable add-ons are removed before display/submission; notices and required/default rules covered. Output is revalidated by the existing model |
| Non-entry admin pages inflate login JS | Lazy orders, order detail, delivery, settings, feedback and testimonials | Entry JS −66,995 bytes; authentication/active-role guards remain outside Suspense boundaries |
| Public UUID image paths are replaced, never overwritten | New uploads request 31,536,000-second cache lifetime, still `upsert:false` | Configuration change only; no claim of measured CDN savings or deployed immutable response header |

Public image caching follows [Supabase's documented browser cache control and new-path replacement guidance](https://supabase.com/docs/guides/storage/cdn/smart-cdn). These are intentionally public product photographs. Old URLs can remain in browser caches after removal; replacement points to a new UUID. Private objects, Storage policies, upload validation, five-MiB input limit, WebP conversion, maximum 1600-pixel dimension, cleanup ordering and authenticated SDK path are unchanged. No live upload was made.

## Before/after measurements

All values below are medians of five full interaction runs. Durations are milliseconds; scripting covers the complete open/scroll/configure/close scenario, not just the opening.

| Initial comparison | Before | After |
|---|---:|---:|
| Desktop dialog observation | 30.8 | 38.3 |
| Desktop scripting | 18.56 | 12.16 |
| Desktop scroll p95 frame interval | 17.1 | 16.8 |
| 4× mobile dialog observation | 138.7 | 161.9 |
| 4× mobile scripting | 130.66 | 170.03 |
| 4× mobile scroll p95 frame interval | 18.2 | 21.6 |

| Paired rerun, final source | Preserved baseline | Final |
|---|---:|---:|
| Desktop dialog observation | 56.3 | 50.3 |
| Desktop scripting | 51.19 | 39.42 |
| Desktop layout | 4.39 | 6.35 |
| Desktop scroll p95 interval | 7.1 | 17.7 |
| 4× mobile dialog observation | 196.9 | 186.7 |
| 4× mobile scripting | 192.11 | 164.55 |
| 4× mobile layout | 16.50 | 15.49 |
| 4× mobile scroll p95 interval | 22.9 | 27.4 |
| Admin desktop editor observation | 92.9 | 60.2 |
| Admin 4× mobile editor observation | 369.6 | 390.3 |
| Admin desktop scrolling main-thread task time | 191.15 | 182.05 |
| Admin mobile scrolling main-thread task time | 1015.96 | 910.60 |

The paired scripting reduction is 23% desktop / 14% throttled mobile; the initial mobile run did not show the same gain. Overall open/scroll latency is **inconclusive**, not a consistent win. Desktop original-mode scenarios introduced no >100 ms long task. Throttled runs still contain >100 ms tasks (final paired maximum 192 ms versus baseline paired 198 ms). Unforced heap observations cannot establish retained-memory growth or absence of leaks. No physical-device/Core Web Vitals claim is made. Paired timings precede the final cleanup-only guard against callbacks after disposal; final ordinary build sizes and functional/unit checks include that guard.

### Paint and compositing decision

The baseline tested unchanged CSS, backdrop blur disabled, footer blur disabled, and both disabled. Desktop median scroll p95 was 17.1 / 17.4 / 17.7 / 17.4 ms; throttled mobile was 18.2 / 18.5 / 18.3 / 18.3 ms. Admin baseline backdrop removal changed editor latency 46.7 → 47.1 ms desktop and 238.5 → 238.2 ms mobile, with no consistent scrolling benefit.

Mobile baseline scroll traces recorded Paint 162.97 ms unchanged versus 170.37 ms without backdrop, 169.73 ms without footer, 155.17 ms without both. RasterTask was 3.06 / 3.04 / 3.04 / 2.76 ms. These are aggregate trace events, not exclusive GPU time. They do not justify a visual change. Both native backdrops, the sticky action footer, header effects, and reduced-motion rules are therefore retained. No `will-change`, containment, virtualization or new animation was added.

### Network and backend

- Dialog opening/configuration: **zero catalog requests before and after**. Admin editor opening: zero additional HTTP requests in the measured fixture.
- Realtime burst: **11 → 2 desktop; 11 → 2–4 throttled mobile**. A fixed window adds at most 100 ms scheduled delay before refetch (busy-main-thread timer delay and network time remain additional). Existing 60-second foreground polling, focus recovery, query normalization and RLS-filtered adapter reads remain intact.
- Hosted read-only probes: products 8,016 bytes / seven rows / median 384.72 ms; categories 309 bytes / 348.00 ms; delivery zones 500 bytes / 337.43 ms; public payment options 51 bytes / 350.65 ms. These include network latency and are **not database execution timings**. Menu normalization median 0.137 ms on this machine.
- Five sampled public product image GETs returned HTTP 400 with 88-byte error bodies. This pre-existing hosted image-delivery limitation prevents a successful-photo transfer/decode/cache comparison. Fallback behavior remains. No oversized-photo optimization is claimed.
- No authenticated backend or local Docker/Podman runtime was available. Real admin RPC, analytics SQL, order creation, WhatsApp creation, Paystack initialization/verification and EXPLAIN timings are NOT RUN. Mocked request timings cannot justify database indexes; none were added.

### Ordinary production asset sizes

Bytes, measured from both ordinary Vite builds (not instrumentation builds):

| Asset | Before | After | Change |
|---|---:|---:|---:|
| Storefront entry JS | 759,628 | 760,469 | +841 (+0.11%) |
| Storefront entry JS gzip | 226,347 | 226,678 | +331 |
| Storefront all JS | 830,012 | 830,853 | +841 |
| Storefront CSS | 44,631 | 44,631 | 0 |
| Admin entry JS | 750,982 | 683,987 | −66,995 (−8.9%) |
| Admin entry JS gzip | 222,451 | 204,071 | −18,380 (−8.3%) |
| Admin all JS | 1,229,512 | 1,235,186 | +5,674 (+0.46%) |
| Admin CSS | 28,698 | 28,698 | 0 |

Admin splitting trades small shared-chunk/wrapper overhead and extra cold-route asset requests for a smaller login/initial payload. Dashboard/menu/analytics lazy loading remains; every new operational lazy route still runs under `ProtectedRoute`. Complete chunk inventories and route request counts are in the JSON evidence. No additional dependency was installed.

## Security and accessibility review

Changed-code review plus existing executable/structural tests cover frontend env allowlists, backend-only secrets, strict configuration/checkout validation, integer-kobo server repricing, disabled-method rejection, unauthorized admin handling, raw-body webhook authentication, verification rules, payment/fulfilment separation and public/private view privileges. Final secret scan includes source, untracked source and ordinary builds. It is a pattern scan, not Git-history or live credential proof.

No Supabase migration/function, RLS policy, grant, trusted RPC, auth provider, payment handler, CSP/header configuration or private cache/persistence policy changed. No production instrumentation, public CDN caching of private data, service worker, new VITE variable, raw HTML rendering or direct browser commerce writes were introduced. Auth-driven cache clearing is unchanged.

Native dialog markup, initial focus, focus containment, Escape, backdrop handling, focus restoration, labels, disabled controls and reduced motion remain. Browser runs check Escape/restoration during every performance repetition; Cycle 18 checks axe and responsive layouts at five widths. Manual screen-reader, Safari/Firefox and physical touch-device acceptance remain NOT RUN.

## Verification and remaining acceptance

No test is skipped to obtain a green result. The old Cycle 6 source assertion now follows the extracted invalidator module; executable coalescing/cleanup tests were added rather than removing that security/correctness contract.

| Command | Result |
|---|---|
| Baseline `npm run verify` | PASS after reviewed filesystem escalation: lint, 184 tests, both builds |
| Baseline `npm run test:secrets` | PASS |
| Baseline `npm run test:browser:cycle18` | PASS: 104 checks, all five journeys, five widths |
| Final `npm run verify` | PASS: lint, 187 tests, both builds |
| Final `npm run test:secrets` | PASS: 361 source/built files, no detected credential patterns |
| `node scripts/verify-performance.mjs before` and admin baseline | PASS after correcting the admin harness's empty-style fixture |
| `npm run test:performance` | PASS: zero unchanged card/list renders, zero dialog refetches, latency budgets; recorded noisy timing |
| Preserved baseline / final-source paired performance runs | PASS, with the qualifications in the measurement tables |
| `node scripts/measure-public-performance.mjs` | Completed 12 public projection GETs (200) and five image GETs (400); not an image-health pass |
| Expanded Cycle 18 browser suite | PASS: 109 checks, all five purchase journeys, five widths, zero axe/overflow/runtime failures |
| Existing Cycle 17 content browser suite | PASS using `NUEDE_BROWSER_CHANNEL=msedge`; default downloaded Chromium absent |
| `git -c core.autocrlf=false diff --check` | PASS |

The new image fixture initially stalled with concurrent uploads and was interrupted; a bounded, sequential upload sequence matches the application's actual replacement flow. Conversion, type/size/corruption rejection and both HTTP upload assertions then passed. No production Auth/Storage check was removed or bypassed. A transient mid-change Cycle 6 source-location assertion failed after extraction; it was corrected to inspect the extracted implementation and supplemented with executable behavior tests.

Local database reset, pgTAP and local Auth/Storage attack suites are NOT RUN because Docker/Podman is unavailable. No hosted reset, write, payment, migration, deploy or Git push was attempted. Existing Cycle 18 launch blockers are not resolved by this performance pass.

Full acceptance still requires reproducing the affected device's scrolling issue and confirming a material improvement there, successful real catalog image delivery, and the separately documented live backend/security gates. Current measurements support the narrower rendering/network/bundle improvements above.

## Deliberately not changed

- Blur surfaces: no repeatable measured improvement sufficient to justify changing the design.
- Product-detail lazy loading: avoid adding first-click chunk latency; customization calculations are small and not a demonstrated separate hotspot.
- Price/nutrition arithmetic: existing domain/model authorities retained; no indiscriminate memoization.
- Menu payload/API: tiny live response and one embedded read; no detail API or N+1 queries.
- Saved/cart/planner context splits or deferred localStorage writes: no measured write bottleneck justifying state-loss/complexity risk. Card memoization already isolates parent cart updates while favorites remain context-responsive.
- Virtualization/pagination changes: order and content lists already use bounded server queries; no evidence supports rewriting menu/planner accessibility or list behavior.
- Images/srcset/transformation dependency: successful hosted photos and meaningful image-size comparison unavailable; upload optimization already exists.
- Analytics/backend caching/indexes: existing aggregation, pagination and private cache clearing retained; no authenticated timing/EXPLAIN evidence.

## Reproduction and file inventory

Run `npm run verify`, `npm run test:secrets`, `npm run test:browser:cycle18`, then `npm run test:performance`. The performance script expects current ordinary `apps/*/dist` builds for its size report; it creates separate instrumented production builds under ignored coverage. Installed Edge is the default; `NUEDE_BROWSER_CHANNEL=chrome` selects installed Chrome. `node scripts/measure-public-performance.mjs` is optional and makes read-only public requests to the configured storefront backend.

For a pre-change baseline run `node scripts/verify-performance.mjs before` and `node scripts/measure-admin-performance.mjs before`. To reuse preserved builds, set `NUEDE_PERF_REUSE=before` and optionally `NUEDE_PERF_MODES=original`, then use a distinct output label such as `before-paired`; do not reuse an output label concurrently. Comparisons must use equivalent machine load, browser, viewport, fixtures and throttle.

Application changes:

- `apps/storefront/src/features/menu/components/MenuProductCard.jsx`
- `apps/storefront/src/features/menu/hooks/useMenuRealtime.js`
- `apps/storefront/src/features/menu/utils/catalogInvalidation.js`
- `apps/storefront/src/features/product-detail/hooks/useProductCustomization.js`
- `apps/storefront/src/features/product-detail/utils/customizationState.js`
- `apps/admin/src/features/catalog/components/ProductList.jsx`
- `apps/admin/src/pages/MenuPage.jsx`
- `apps/admin/src/features/catalog/api/imageApi.js`
- `apps/admin/src/app/router.jsx`

Verification/documentation: `package.json`, `scripts/verify-cycle6.test.js`, `scripts/verify-cycle18-browser.mjs`, `scripts/cycle18-browser-fixtures.mjs`, `scripts/verify-performance.test.js`, `scripts/verify-performance.mjs`, `scripts/measure-admin-performance.mjs`, `scripts/measure-public-performance.mjs`, this report, `PERFORMANCE-MEASUREMENTS.json`, and `DEVELOPMENT.md`.

Proposed commit message: `perf: harden Nuede storefront and admin responsiveness`.
