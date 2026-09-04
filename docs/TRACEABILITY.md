# Requirement traceability

## Public-view advisor follow-up

Required: public checkout options/published stories without private metadata or privileged view execution → implemented in migration `20260904000400_use_invoker_public_views.sql` with invoker views, column grants and guest-only policies → seven embedded PostgreSQL checks PASS; full Node suite 179 PASS; hosted application/advisor rescan NOT RUN. See [evidence](PUBLIC-VIEW-SECURITY.md).

## Cycle 18 — final hardening, external launch blocked

[Current verification report](CYCLE18.md), [all 212 numbered requirements](FEATURE-MATRIX.md), and [deployment runbook](DEPLOYMENT.md) supersede historical “not begun” statements below. Cycles 0–17 remain accepted. Current hosted schema/function gaps are recorded explicitly and no final launch proof is claimed.

| Required | Implemented | Tested |
|---|---|---|
| 96 recent dashboard orders | `RecentOrders` reuses protected paginated order API with loading/error/empty states | Populated dashboard in Cycle 18 mocked browser matrix; hosted RPC unavailable |
| 99 operational counts; 105 cart/meal-plan breakdown | Existing analytics RPC extended; separate created-date activity and verified-payment-date sales | Browser render and source review; five new pgTAP assertions NOT RUN |
| 141 audit; 142 owner/admin settings permissions | Server actor attribution/audit and narrow RLS permission helper; read-only editor UI | Mocked editor check PASS; SQL role/actor/no-op tests NOT RUN |
| 167, 194 backend method enforcement | Order-insert trigger locks enabled settings; bounded handlers and provider response timeout | Node rejection/timeout tests PASS; real database race test NOT RUN |
| 168–177 responsive/accessibility/error states | Carousel containment, keyboard tables/charts, logout/toast semantics, no false zero revenue | Five-width content/full-commerce browser tests; physical devices/manual screen reader NOT RUN |
| 185–188 deployment | Independent Vercel configs, safe public env guard, secrets scan and launch runbook | Both builds and scan PASS; actual V2 deployments NOT RUN |
| 154–166 private boundaries | Existing RLS and safe public testimonial projection preserved | Public hosted probes identify six contract failures; full RLS/SQL execution NOT RUN |
| Complete launch chain | Reproducible real-flow instructions and evidence gates | Five mocked UI journeys PASS; FINAL LAUNCH PROOF NOT RUN |


This ledger maps requirements to implementation and evidence. It is updated during each cycle's inspection and implementation.

## Cycle 17 — implementation and available verification

Cycles 0–16 are the accepted foundation for this work. Cycle 17 proceeded without a pre-flight approval gate. [Full implementation, contracts and verification record](CYCLE17.md).

| Requirement | Required → implemented | Tested |
|---|---|---|
| 2 | Hero slides, rotation, indicators, controls, animation, responsive imagery and menu/planner CTAs → `Hero.jsx`, existing `ProductImage` | Browser rendering, navigation target, reduced motion, five viewport widths; lint/build |
| 3 | About / food philosophy → completed homepage brand and ordering copy | Browser and source checks |
| 4 | Live featured carousel, prices, nutrition, variants, availability, quick add → `FeaturedMeals.jsx`, existing menu cache/cards/configuration validator/cart/detail dialog | Unit availability/variant regressions; browser quick add, sold-out guard, grouped dialog, responsive checks |
| 143 | Published-only stories with ratings → narrow `published_testimonials` projection and public carousel | Node contract tests; browser empty/error/public states, numeric ratings and keyboard scroll; live SQL NOT RUN |
| 144 | Authorized testimonial CRUD and explicit publication → protected Testimonials page, editor, confirmation dialogs, existing RLS roles | Browser create via conversion, edit/rating, publication failure/retry, publish/unpublish/delete; SQL authorization matrix NOT RUN |
| 145 / 154 | Reflect public changes → 30-second foreground Query refetch and window-focus/remount refresh | Source assertions and browser publication/refetch on reload; no private Realtime subscription |
| 146–147 | Five-field guest feedback and six canonical subjects → RHF/Zod form and write-only API | Unit subjects/limits/rating/email; browser inline errors, pending guard, retained failure values and success |
| 148 / 160–161 | Private feedback and restricted content management → column INSERT grants, active-admin RLS, narrow public projection | Static contract assertions; real role/grant/row tests in `011_cycle17_content.test.sql` NOT RUN without local Supabase |
| 149 | Private admin inbox, full detail, search and combined subject/rating filters → bounded server queries and native dialog | Browser filter/no-results/reset/private detail; source pagination contract; live DB NOT RUN |
| 150 | Deliberate editable copy without publishing or deleting source → existing unique source FK, unpublished insert, DB published-insert rejection | Unit allowlist/source preservation; browser redaction/draft/publication sequence and source preservation; SQL trigger matrix NOT RUN |
| 151 | Accessible FAQ → seven native disclosures | Browser keyboard expand/collapse |
| 152 | Nutrition variation disclaimer → visible homepage note and footer reference | Unit copy checks and browser rendering |
| 153 | Contact/footer/social → centralized optional approved values and valid destinations; Abuja context and feedback fallback | Unit missing/unsafe/configured destination checks; browser missing-config rendering |
| Cycle 17 cross-cutting | Responsive states, unique state IDs, labeled forms, numeric ratings, focus restoration, reduced motion, text rendering | Browser desktop/mobile and 320/390/768/1024/1440 widths, nested dialog focus and untrusted-text check; lint/build |
| Cycle 17 audit | Database-owned create/edit/publish/unpublish/delete/conversion events in existing log | Static checks; actual audit trigger assertions NOT RUN |
| Regression | Preserve commerce, admin authorization and Cycle 16 analytics | Complete 162-test Node suite PASS; both builds PASS; live auth/database NOT RUN |

No known Cycle 17 implementation defect remains after review. Migration replay and database/Auth/RLS integration are unverified because local Supabase is unavailable. Production contact destinations/hours must still be supplied by the business; no fake values were published. Abuse throttling and production launch verification remain outside this cycle. Cycle 18 has not begun.

## Cycle 0 foundation

| Requirement ID | Requirement | Implementation location | Status | Automated verification | Manual acceptance |
|---|---|---|---|---|---|
| C0-001–010 | Accepted Cycle 0 engineering foundation | Cycle 0 checkpoint `3ccbb0f` | Accepted | Foundation tests, lint and accepted checkpoint | User confirmed Cycle 0 accepted before Cycle 1 |

`Implemented` means the files exist but have not yet passed the separate review, verification, and manual-acceptance stages.

## Product requirements

Features 1-212 in the complete feature specification are `Planned` across Cycles 1-18. None is implemented by Cycle 0. Each cycle must add or refine requirement-level rows here with:

```text
Requirement ID -> source section -> cycle -> implementation path -> status -> automated evidence -> manual evidence
```

Requirements must not be marked `Verified` until objective checks pass or `Accepted` until the user confirms the manual behavior.

## Cycle 1 application shells

| Requirement ID | Requirement | Implementation location | Status | Automated verification | Manual acceptance |
|---|---|---|---|---|---|
| C1-001 / Spec 1 | Responsive storefront navigation shell | `apps/storefront/src/components/layout` | Implemented | Pending Cycle 1 tests/build | Pending |
| C1-002 | Storefront route skeleton and Not Found | `apps/storefront/src/app`, `src/pages` | Implemented | Pending route-manifest test | Pending |
| C1-003 / Spec 86–87, 178 | Independent admin shell and route tree | `apps/admin/src/app`, `src/components/layout` | Implemented | Pending route/boundary tests | Pending |
| C1-004 | Admin login, dashboard and operational page shells | `apps/admin/src/pages` | Implemented | Pending builds | Pending |
| C1-005 / Spec 168–169 | Loading, error and empty-state foundations | both apps' `components/ui/FeedbackStates.jsx` | Implemented | Pending builds | Pending |
| C1-006 / Spec 18, 175 | Accessible dialog, labels, focus and keyboard foundations | both apps' UI/layout components | Implemented | Pending builds | Pending keyboard test |
| C1-007 / Spec 176–177 | Responsive storefront and admin composition | both apps' layouts/pages/styles | Implemented | Pending builds | Pending viewport review |
| C1-008 / Spec 180 | JavaScript-only implementation | repository-wide | Implemented | Pending architecture test | Pending |
| C1-009 | Shared design tokens with app-owned React UI | `packages/config/src/brand.css`, app UI folders | Implemented | Pending boundary test | Pending visual review |
| C1-010 | Fixture-only data and no future-cycle integration | both apps' `src/fixtures`, Cycle 1 scope tests | Implemented | Pending scope test | Pending |

### Feature placeholder map

| Surface | Foundation implemented in Cycle 1 | Feature behavior remains planned |
|---|---|---|
| Storefront menu | Route, controls, cards, modal visual pattern | Live menu/search/filter Cycle 6; customization Cycle 7; cart Cycle 9 |
| Saved meals | Route and empty state | Favorites/localStorage Cycle 8 |
| Meal planner | Responsive grid, library, summary regions | Scheduling/persistence/drag-drop Cycle 10 |
| Checkout/payment | Forms, summaries, status presentation | Checkout Cycle 11; orders Cycle 12; WhatsApp Cycle 13; Paystack Cycle 14 |
| Admin login | Form shell | Auth, sessions, route guards, RLS Cycle 3 |
| Admin menu | Table, filter and editor patterns | Catalog CRUD Cycles 4–5 |
| Admin orders | Search/filter/table shell | Order management Cycle 15 |
| Admin analytics | Cards and chart container | Trusted analytics Cycle 16 |
| Delivery/settings/testimonials/feedback | Management page shells | Respective backend and content workflows in assigned later cycles |

Cycle 1 checkpoint: `65eadef feat: build storefront and admin application shells`. It is the known-good Git gate for Cycle 2.

## Cycle 2 database foundation

| Requirement ID | Requirement | Database object / implementation | Status | Automated verification | Manual acceptance |
|---|---|---|---|---|---|
| C2-001 / Spec 155–158 | PostgreSQL source of truth and reproducible migrations | `supabase/config.toml`, initial migration, `seed.sql` | Implemented | Pending local reset and pgTAP | Pending |
| C2-002 / Spec 5–10, 114–121 | Configurable categories and stable standard-product storage | `categories`, `products` | Implemented | Schema/constraint tests added | Pending |
| C2-003 / Spec 11–15, 122–126 | Grouped-product variants and default/explicit selection | `product_variants`, default-variant FK/integrity triggers | Implemented | Relationship/constraint tests added | Pending |
| C2-004 / Spec 19–21, 127–129 | Compatible multiple/shared add-ons | `product_addons`, `product_addon_assignments` | Implemented | Seed relationship tests added | Pending |
| C2-005 / Spec 22–24 | Complete, partial, and unavailable nutrition | Nullable nutrition columns and non-negative checks | Implemented | Partial/negative tests added | Pending |
| C2-006 / Spec 50–53, 135–137 | Configurable delivery zones and kobo fees | `delivery_zones` | Implemented | Seed/type/constraint tests added | Pending |
| C2-007 / Spec 57, 138–142, 157 | Persist checkout methods; retain at least one enabled method | `checkout_settings`, row check, singleton/delete trigger | Implemented | Invalid update/delete tests added | Pending |
| C2-008 / Spec 88–91 | Future trusted admin/Auth relationship and roles | `admin_users` -> `auth.users` | Implemented | FK/role tests added | Pending Cycle 3 auth behavior |
| C2-009 / Spec 65–70 | Permanent order storage and separate statuses | `orders` | Implemented | Schema/status/total tests added | Pending Cycle 12 population logic |
| C2-010 / Spec 67 | Immutable purchased product/variant snapshots | `order_items` | Implemented | Schema/quantity tests added | Pending Cycle 12 population logic |
| C2-011 / Spec 67, 102 | Immutable purchased add-on snapshots | `order_item_addons` | Implemented | Schema/FK tests added | Pending Cycle 12 population logic |
| C2-012 / Spec 75–85 | Payment history and idempotent provider-reference storage | `payments`, unique provider-reference index | Implemented | Schema/index/type tests added | Pending Cycle 14 payment behavior |
| C2-013 / Spec 143–150 | Testimonial and private-feedback storage | `testimonials`, `feedback` | Implemented | Rating/seed tests added | Pending Cycle 17 workflows/RLS |
| C2-014 / Spec 167 | Administrative audit storage shape | `admin_audit_log` | Implemented | Schema/FK/index tests added | Pending authorized audit writers |
| C2-015 / Spec 64 | Integer-kobo persistence | All `*_kobo` columns use checked `bigint` | Implemented | Static and database type tests added | Pending inspection |
| C2-016 | Preserve Cycle 3+ boundaries | No RLS, frontend queries, Edge commerce logic, auth flow, or CRUD | Implemented | Scope test added | Pending inspection |

`Implemented` here means the Cycle 2 files exist. No row may be changed to `Verified` before local database reset/tests and application checks pass, or to `Accepted` before the user completes manual acceptance.

## Cycle 3 authentication and row-level security

| Requirement ID | Requirement | Implementation location | Status | Automated verification | Manual acceptance |
|---|---|---|---|---|---|
| C3-001 / Spec 88–91 | Supabase email/password login with no public registration | Admin auth API, login page, local Auth config | Implemented | Cycle 3 static/Auth tests added | Pending |
| C3-002 | Persistent session initialization and expiry handling | `AuthProvider`, Supabase Auth listener | Implemented | Direct session persistence test added | Pending refresh/expiry check |
| C3-003 | Logout invalidates the local browser session | Auth API and admin layout | Implemented | Direct logout test added | Pending |
| C3-004 | Protect all operational admin routes | Admin router, `ProtectedRoute`, `PublicOnlyRoute` | Implemented | Static route-boundary test added | Pending |
| C3-005 | Supabase account is not sufficient for administration | Own-profile policy and active-admin helper | Implemented | Non-admin persona tests added | Pending |
| C3-006 | Inactive administrator remains denied | `admin_users.is_active`, Auth provider, RLS helper | Implemented | Inactive persona tests added | Pending |
| C3-007 | Preserve owner/admin/editor without invented RBAC | Role constraint and active-admin helper | Implemented | Three-role authorization tests added | Pending |
| C3-008 | Public catalog reads expose only customer-visible records | Catalog/delivery/testimonial SELECT policies | Implemented | pgTAP and direct anon queries added | Pending |
| C3-009 | Public checkout contract excludes admin metadata | `checkout_payment_options` view | Implemented | View-column and direct metadata-denial tests added | Pending |
| C3-010 / Spec 143–150 | Anonymous feedback submission; private feedback reads | Feedback grants and policies | Implemented | Insert/read attack tests added | Pending |
| C3-011 | Public product/price and admin-user mutation denied | Explicit grants and RLS | Implemented | Direct mutation/enumeration attacks added | Pending |
| C3-012 | Direct authoritative order creation remains denied | Orders default-deny write boundary | Implemented | Direct anon/admin insert attacks added | Pending Cycle 12 order engine |
| C3-013 | Payment and checkout-setting mutation remain trusted | Read-only active-admin policies | Implemented | Direct mutation attacks added | Pending Cycles 11/14 |
| C3-014 | Browser code contains no backend credentials | Central public client and env convention | Implemented | Static secret checks added | Pending bundle inspection |
| C3-015 | Direct security evidence bypasses frontend | Local persona attack utility and pgTAP | Implemented | Pending execution with local Supabase | Pending |

`Implemented` means the Cycle 3 code exists. It remains neither `Verified` nor `Accepted` until the complete automated and manual evidence passes.

Cycle 3 was subsequently reviewed and accepted by the user at checkpoint `7a88c15`. Its checkpoint report preserved the unavailable local Docker/database evidence rather than claiming it passed.

## Cycle 4 admin catalog management

| Requirement ID | Requirement | Implementation location | Status | Automated verification | Manual acceptance |
|---|---|---|---|---|---|
| C4-001 | Create, rename, order, enable, and disable categories | Catalog API/hooks and `CategoryManagerDialog` | Implemented | Static/unit coverage passed; local database utility added | Pending local UI/PostgreSQL run |
| C4-002 / Spec 114 | Browse standard products with operational states | `MenuPage`, `ProductList`, status badges | Implemented | Admin build and state-boundary tests passed | Pending viewport/data review |
| C4-003 / Spec 115–116 | Create and edit standard products | `ProductEditorDialog`, catalog API | Implemented | Form/mapping tests passed | Pending local create/edit |
| C4-004 / Spec 117–119 | Name search, category filter, and status filter | `ProductFilters`, `filterProducts` | Implemented | Composed-filter unit test passed | Pending live catalog exercise |
| C4-005 / Spec 120 | Available, sold-out, hide, show, archive, restore | `ProductActions`, status mutation/transition utility | Implemented | Transition tests and direct local utility added | Pending local lifecycle exercise |
| C4-006 / Spec 64, 166, 183–184 | Integer-kobo, optional nutrition, runtime form validation | `@nuede/validation/catalog`, `@nuede/domain/currency`, DB constraints | Implemented | Money and validation unit tests passed | Pending invalid UI/database submission |
| C4-007 / Spec 168–169, 182 | Loading/error/empty/pending states and query cache invalidation | TanStack Query hooks, feedback states, toasts | Implemented | Architecture tests and builds passed | Pending controlled UI-state review |
| C4-008 / Spec 159, 161 | Active-admin writes and anonymous write rejection | Existing Cycle 3 RLS; centralized browser client | Implemented | Static RLS boundary and local attack utility added | Pending local persona run |
| C4-009 / Spec 167 | Product created, edited, price, status, archive, and restore audit events | Cycle 4 audit migration and pgTAP test | Implemented | Static audit tests passed; pgTAP/direct run pending Docker | Pending audit-row inspection |
| C4-010 / Spec 175–177 | Responsive and accessible admin catalog | Desktop table, mobile cards, labels, native dialogs, live feedback | Implemented | Lint/build passed | Pending desktop/tablet/mobile/keyboard review |
| C4-011 / Spec 121 | Preserve archive-first lifecycle and scope boundary | No delete control; traceable deferral | Deferred | Scope test confirms no delete/Storage/variant/add-on work | Product deletion not assigned by Cycle 4 roadmap |

Cycle 6 live storefront queries and Realtime remain `Planned` and were not started by Cycle 5.

## Cycle 5 images, grouped variants, and add-ons

| Requirement ID | Required | Implemented | Tested | Manual acceptance |
|---|---|---|---|---|
| C5-001 / Spec 130–134 | Supabase Storage image bucket, upload, preview, validation, and practical optimization | Migration-owned `product-images` bucket; `imageApi.js`; `CatalogImageField` | JS validation/safe-ordering tests passed; pgTAP/direct Storage tests added, pending Docker | Pending upload/replace/reload/cleanup flow |
| C5-002 / Spec 115 | Standard meal image and compatible optional add-ons | Extended `ProductEditorDialog`, image orchestration, assignment RPC | Lint/unit/admin build passed; live persistence pending | Pending |
| C5-003 / Spec 11–12, 122–123 | Create/edit/search/status-manage grouped parents with parent image/settings | Menu type filter/list and `GroupedProductEditorDialog` | Mapping/orderability unit tests passed; direct lifecycle test added, pending Docker | Pending |
| C5-004 / Spec 12–13, 124–125 | Create/edit/remove variants with permanent IDs and complete independent fields | `VariantEditorDialog`, variant API/hooks, stable UUID inserts | Stable-ID/price/state unit tests passed; direct CRUD test added, pending Docker | Pending three-variant flow |
| C5-005 / Spec 124–125 | Accessible variant reorder without changing IDs | Labelled up/down controls and `reorder_product_variants` | Pure reorder test passed; pgTAP/function/direct-order tests added, pending Docker | Pending keyboard/reload inspection |
| C5-006 / Spec 14 | Automatic default or explicit customer-choice configuration | Group selection mode and same-group available default options | Schema/domain tests passed; database transition tests added, pending Docker | Pending persisted mode/default flow |
| C5-007 / Spec 15 | Variant-specific availability and visibility | Independent constrained variant state and edit controls | Independent state tests passed; direct test added, pending Docker | Pending reload/independence flow |
| C5-008 / Spec 126 | Group cannot be orderable without a valid orderable variant | UI explanation plus product/variant transition triggers | Unit tests passed; zero/hidden/sold-out/final-child pgTAP/direct tests added, pending Docker | Pending invalid-transition UI flow |
| C5-009 / Spec 19–20, 127–128 | Add-on create/edit/remove, kobo price, nutrition, stable ID, and availability | `AddonManagerDialog`, schemas, API/hooks | Unit tests passed; direct CRUD/audit test added, pending Docker | Pending create/edit/disable/reload |
| C5-010 / Spec 21 | Foundation for multiple compatible add-ons | Existing many-to-many assignments exposed through reusable picker and atomic replacement RPC | Static/unit relationship tests passed; direct multi-surface test added, pending Docker | Pending multi-add-on selection inspection |
| C5-011 / Spec 129 | Group-level add-ons shared across every variant | Group parent assignment picker; no variant-specific add-on model introduced | Architecture tests passed; direct group assignment test added, pending Docker | Pending reload inspection |
| C5-012 / Spec 159–161 | Anonymous catalog/Storage writes denied; active admins succeed | Existing catalog RLS plus four Storage policies using `private.is_active_admin()` | Static tests passed; pgTAP and direct attack tests added, pending Docker | Pending logged-out/admin checks |
| C5-013 / Spec 166, 183–184 | Central runtime validation for grouped, variant, add-on, image, relationship, and money input | Shared Zod schemas and domain rules | JS validation suite passed | Pending invalid-form review |
| C5-014 / Spec 167 | Important grouped/variant/add-on/image-reference actions audited | Extended trusted trigger functions; browser audit writes remain denied | Static audit checks passed; pgTAP/direct event tests added, pending Docker | Pending audit-row inspection |
| C5-015 / Spec 168–170, 175 | Complete feedback states and accessible controls/dialogs/reorder/upload | Existing primitives extended with labelled inputs, alerts, busy states, confirmations, preview fallback, and arrow controls | Lint and both builds passed; React review completed | Pending desktop/mobile/keyboard review |
| C5-016 | Preserve Cycle 6+ boundary | Storefront remains fixture-backed; no customer selector/cart/live query | Explicit scope test passed | Confirmed by source review |

`Tested` above distinguishes executed evidence from tests merely added. Docker-backed migration, pgTAP, RLS/Storage utilities, and the full manual sequence remain pending; therefore Cycle 5 is `Implemented`, not `Verified` or `Accepted`.

## Cycle 6 live storefront menu

| Requirement ID | Required | Implemented | Verification status | Manual acceptance |
|---|---|---|---|---|
| C6-001 | `/menu` reads Supabase rather than catalog fixtures | Feature API and TanStack Query hooks replace `demoMeals` on the live route | Focused architecture test, lint, and storefront build passed | Pending live configured environment |
| C6-002 | Centralized, non-N+1 public data access | Separate category read and one product read embedding enabled category plus variants | Static architecture assertions added | Pending network inspection |
| C6-003 | Database-driven enabled categories and All concept | Category query ordered by `sort_order`; responsive ID-based category chips | Filter unit coverage added | Pending admin create/rename/reorder/disable exercise |
| C6-004 | Standard/grouped products, images, prices, and nutrition previews | Stable menu model, Storage URL adapter, grouped card indicator, representative variant preview | Model tests include standard/grouped paths | Pending visual/live data review |
| C6-005 | Correct public product states | Available, sold-out, price-pending, unavailable presentations; hidden/archive excluded by query and RLS | Group state and query-contract tests added | Pending admin lifecycle exercise |
| C6-006 | Search and composable filters | Case-insensitive name/description/category search; category/grouped/available/high-protein/complete-nutrition intersection | Pure filter tests added | Pending keyboard/mobile exercise |
| C6-007 | Loading, error, retry, empty-menu, and no-results states | Skeleton plus shared feedback primitives and reset/retry actions | Source tests, lint, and storefront build passed | Pending induced network/empty-data review |
| C6-008 | Selective Realtime updates and cleanup | Categories/products/variants channel invalidates query cache; publication migration; focus/interval recovery | Subscription/publication static tests added | Pending two-browser admin/storefront exercise |
| C6-009 | Responsive and accessible menu | 1/2/3-column grid, horizontal category overflow, wrapping refinements, labelled search, pressed buttons, textual status, alt/fallback images | Lint and storefront build passed | Pending target viewport and keyboard review |
| C6-010 | Preserve security and future-cycle boundaries | Anon key only; no writes/service role; no cart/customization/favorites/planner implementation | Source and built-bundle secret scans plus boundary tests passed | Pending live RLS inspection |

The High Protein menu refinement uses a transparent presentation threshold of at least 30g protein in the representative catalog nutrition record. Grouped nutrition is a preview from the configured default variant when public, otherwise the first orderable/priced public variant; full aggregate nutrition logic remains deferred to Cycle 8.

## Cycle 7 product details and customization

| Requirement ID | Required | Implemented | Verification status | Manual acceptance |
|---|---|---|---|---|
| C7-001 | Open live standard/grouped meal details without a duplicate product query | Explicit card controls and `ProductDetailDialog` consume the current menu-cache product | Architecture test and build passed; qualified PostgREST child relationship added | Verified against connected seven-product menu; category/product requests returned 200 |
| C7-002 | Standard detail image, description, price, nutrition, availability, add-ons, and quantity | Responsive detail overview and selectors use normalized database values | Focused model/price/nutrition tests passed | Verified with Grilled Citrus Chicken and live image fallback |
| C7-003 | Stable grouped variant selection with dynamic detail fields | Variant radios drive image, description, price, nutrition, status, and derived add-ons | Grouped validation/model tests passed | Default and sold-out alternative verified live; no second selectable variant exists for switching |
| C7-004 | Configured default or required explicit selection | `getDefaultVariant` accepts only valid automatic defaults; required groups initialize empty | Default/required tests passed | Automatic default verified live; connected catalog has no explicit-required group |
| C7-005 | Enforce hidden, sold-out, unavailable, stale, and cross-product variants | Visibility filtering, non-orderable controls, catalog reconciliation, and output revalidation | Invalid/mismatch/hidden/sold-out tests passed | Sold-out variant/product, unavailable product, and price-pending product verified; live mutation pending |
| C7-006 | Multiple compatible available add-ons using stable IDs | Assignment-backed checkboxes and selection reconciliation | Duplicate/incompatible/unavailable tests passed | Two live add-ons selected together, then one removed; totals reconciled correctly |
| C7-007 | Dynamic integer-kobo price and honest item nutrition | Reusable derived calculators keep display totals outside identity and mark incomplete nutrients | Price and complete/partial nutrition tests passed | Verified ₦8,500 → ₦12,300 each and ₦24,600 for quantity two; partial nutrition marked |
| C7-008 | Positive whole quantity | Labelled decrement/increment controls enforce minimum one and safe integers | Invalid quantity and multiplication tests passed | Increment/decrement verified; decrement disabled at one |
| C7-009 | Normalized configuration boundary | Frozen `{ productId, variantId, addonIds, quantity }` emitted through `onConfigured` | Standard/grouped shape and no-trusted-total assertions passed | Valid standard selection submitted and dialog closed; consumer remains deferred to Cycle 9 |
| C7-010 | Accessible, focus-safe, responsive modal | Native modal, Escape/cancel, Strict-Mode-safe focus restoration, labelled controls, full-screen mobile and desktop columns | Lint/build/source assertions passed | Escape and trigger-focus restoration verified; 320/390/768/1280px no overflow; axe 0 violations |
| C7-011 | Reconcile live add-on/assignment changes without weakening security | Existing menu query/cache and one Realtime channel extended; migration adds publication tables only | Migration/source assertions passed; no grants added | Connected reads verified; remote publication state and two-browser mutation remain pending |
| C7-012 | Preserve Cycle 8+ boundaries | No favorites, cart store/persistence, planner, checkout, orders, or authoritative frontend price | Full 52-test suite and source review passed | Confirmed by source review |

Cycle 7 verification completed with lint, 52 Node tests, both production builds, connected-project REST reads, live standard/grouped/state interaction, keyboard focus behavior, responsive visual checks, and an axe dialog audit passing. The connected catalog has no explicit-required grouped meal or second selectable variant, and no live admin mutation was made; those live scenarios and the remote Realtime publication state are not claimed.

## Cycle 8 nutrition engine and Saved Meals

| Requirement ID | Required | Implemented | Verification status | Manual acceptance |
|---|---|---|---|---|
| C8-001 | One shared calories/protein/carbohydrates/fat engine | `@nuede/domain/nutrition` owns arithmetic, statuses, aggregation, and formatting | Focused nutrition tests and duplicate-source review passed | Live detail values inspected |
| C8-002 | Complete, partial, and unavailable are machine-readable; null is not zero | Status, per-field completeness, `hasAny`, and nullable known totals | Complete/partial/unavailable/zero-safe fixtures passed | Partial live add-on state remains marked incomplete |
| C8-003 | Standard, variant, add-on, and quantity semantics | Standard base or selected variant plus add-ons, then one quantity scale | Group/variant/add-on/quantity matrix passed | `(610 + 210) × 2 = 1,640 kcal` and corresponding macros verified live |
| C8-004 | Generic, cart-style, and plan-style aggregation without future state | `calculateNutrition`, `calculateCartNutrition`, `calculateMealPlanNutrition` | Multi-item, partial aggregate, empty, slot, five-day total/average tests passed | Domain-only; no cart/planner UI exists |
| C8-005 | Central display formatting and rounding | `formatNutritionNumber`, `formatNutritionValue`, `formatNutrition` | Whole/decimal/null/undefined tests passed | Live menu/detail formatting inspected |
| C8-006 | Cycle 7 consumes the shared engine | `calculateConfiguredItemNutrition` is now a catalog adapter over `calculateItemNutrition` | Cycle 6/7 regressions and full suite passed | Variant/group detail and add-on/quantity updates verified |
| C8-007 | Stable product-level local favorites with no account | `SavedMealsProvider` plus stable product UUIDs only | Persistence/source tests passed | Standard and grouped meals saved; refresh preserved selection |
| C8-008 | Validated centralized browser persistence | `savedMealsStorage.js`, Zod UUID validation, `nuede:v2:saved-meals` | Missing, invalid JSON, object, duplicate, invalid-entry, save/remove/clear tests passed | Invalid JSON and `{}` recovered to the clean empty state |
| C8-009 | Save/remove controls and feedback on menu/detail | Shared `FavoriteButton`, `aria-pressed`, contextual labels, existing toast | Source/accessibility assertions and lint passed | Save toast, visible state, detail state, and keyboard Enter removal verified |
| C8-010 | `/saved` uses live catalog authority | Existing `useMenu`/Realtime cache intersected with saved IDs | Live-model/source tests passed | Live standard/grouped cards loaded from connected catalog |
| C8-011 | Hidden/stale exclusion; sold-out and price-pending fidelity | Only public menu products can become saved view models | Stale ID exclusion/state-preservation tests passed | Sold-out and price-pending saved cards verified; no live admin hide/archive mutation performed |
| C8-012 | Remove, confirmed Clear All, and purposeful empty state | Immediate provider mutations and native confirmation dialog | Storage/source tests passed | Three-meal clear, Escape cancellation, keyboard confirmation, and refresh-stable empty state verified |
| C8-013 | Cross-tab synchronization | Provider handles and cleans up the native `storage` event | Source assertions passed | Removing in a second tab updated the already-open Saved page |
| C8-014 | Responsive and accessible Saved Meals | Reused cards, wrapping actions, native dialog, labels, headings, focus styles | Lint/build/source assertions passed | 320/390/768/1280px had no horizontal overflow; keyboard controls and Escape verified |
| C8-015 | Preserve security and Cycle 9+ boundaries | IDs only, live catalog authority, no schema/RLS/cart/planner/customer-auth changes | Boundary/source tests and both builds passed | Confirmed by source review |

Cycle 8 post-implementation verification passed lint, all 65 Node tests, storefront and admin production builds, and connected browser checks. The browser run covered live saving/removal, refresh persistence, cross-tab synchronization, grouped-detail reopening, sold-out/price-pending fidelity, malformed storage recovery, confirmed Clear All, keyboard activation/Escape, the refactored quantity/add-on nutrition result, and 320/390/768/1280px overflow checks. No live admin hide/archive/delete mutation was made, so private/stale exclusion is supported by the existing public query/RLS contract and deterministic model tests rather than a connected mutation exercise. No database migration was required.

## Cycle 9 shopping cart

| Requirement ID | Required | Implemented | Verification status | Manual acceptance |
|---|---|---|---|---|
| C9-001 | Exact configuration identity without quantity | `@nuede/domain/cart` tuple key uses product, variant, and canonical add-ons | Identity/merge matrix passed | Standard and grouped lines remained distinct as configured |
| C9-002 | Add-on order independence and duplicate removal | One `canonicalizeAddonIds` helper deduplicates and sorts stable IDs | Reordered/duplicate add-on tests passed | Current add-on name/details hydrated from live catalog |
| C9-003 | Immutable add/increment/decrement/remove/replace/clear | Pure domain operations plus provider commits; decrement disabled at one | Quantity, replace-merge, remove, and clear tests passed | Increment, edit, remove path, Escape cancellation, and confirmed clear exercised |
| C9-004 | Validated anonymous persistence and restoration | Versioned `nuede:v2:cart` selection-only payload with per-line Zod filtering | Missing/invalid JSON/wrong version/invalid quantity/duplicate lines passed | Refresh restored quantity; invalid JSON recovered to badge zero without crash |
| C9-005 | Cycle 7 Add to basket integration | Existing validation emits configuration into `CartProvider`; edit reuses detail dialog | Source boundary and Cycle 7 regressions passed | Standard add, grouped default variant, add-on, and edit/reconfigure exercised |
| C9-006 | Total quantity header badge | Provider uses safe sum of line quantities | Item-count tests passed | Badge changed 0 → 1 → 2 → 3/4/7 and persisted after refresh |
| C9-007 | Responsive accessible basket dialog | Existing native `Dialog` gains cart size; labelled controls, semantic output, confirmation | Lint, source assertions, and axe audit passed with 0 violations | Escape restored focus; controls operable; 320/390/768/1280px had no horizontal overflow |
| C9-008 | Live line details without trusted snapshots | Basket hydrates current public menu product/variant/add-on/image/name data | Hydration and stale-source tests passed | Live standard/group/add-on details rendered; hidden fixture showed only generic unavailable line |
| C9-009 | Current availability and stale configuration statuses | Reusable valid/stale/sold-out/price-pending/unavailable/invalid-variant/invalid-add-on model | Product/variant/add-on state tests passed | Injected selection fixtures showed sold-out, generic stale, and invalid-add-on lines; no live admin mutation made |
| C9-010 | Integer-kobo display unit/line/subtotal | Existing customization price adapter plus safe subtotal of orderable lines | ₦9,500 × 2 = ₦19,000 fixture and grouped subtotal tests passed | Live subtotal changed ₦17,000 → ₦30,500 → ₦37,000; invalid lines were excluded and disclosed |
| C9-011 | Explicitly non-authoritative frontend totals and no invented delivery | Selection-only storage; estimate disclosure; delivery calculated at checkout | Source/boundary assertions passed | Disclosure and delivery wording inspected in open basket |
| C9-012 | Cycle 8 cart nutrition and incomplete warnings | Hydrated configured nutrition feeds `calculateCartNutrition` | Complete/partial/stale aggregation tests passed | Live configured totals matched line sums; no-nutrition meal produced known-values-only warning |
| C9-013 | Live query and Realtime reconciliation | Root layout owns the existing menu Realtime invalidation; basket uses the same query cache | Full regression suite passed | Current connected catalog states loaded; no two-browser admin mutation performed |
| C9-014 | Saved Meals separation and security | Separate provider/key; no cart tables, secrets, writes, order creation, or RLS changes | Boundary/source tests and both builds passed | Clear basket stated Saved Meals were unaffected |
| C9-015 | Preserve Cycle 10+ boundaries | Checkout remains its existing shell; no planner/order/payment implementation | Source review and full suite passed | Continue control reached only the pre-existing future checkout shell |

Cycle 9 post-implementation verification passed lint, all 73 Node tests, storefront and admin production builds, and connected browser checks. The browser run covered standard/grouped/add-on cart additions, quantity scaling, refresh persistence, edit/reconfigure, complete and partial nutrition, stale/sold-out/invalid-add-on presentation, invalid JSON recovery, accessible clear confirmation, Escape/focus restoration, zero axe violations, and 320/390/768/1280px overflow checks. The stale/sold-out/invalid-add-on cases were exercised with selection-only localStorage fixtures against the connected public catalog; no live admin catalog mutation or cross-tab run was performed. No database migration was required.

## Cycle 11 delivery and checkout frontend

| Requirement ID | Required | Implemented | Verification status |
|---|---|---|---|
| C11-001 | Deterministic cart/meal-plan source that survives refresh and never combines sources | `/checkout?source=cart` and `/checkout?source=meal-plan`; entry controls emit the explicit source | Unit/source tests passed; both live entry paths and cart-present meal-plan isolation verified |
| C11-002 | Live active delivery zones and integer-kobo fees | Central checkout API plus TanStack Query, focus/interval refresh, delivery Realtime invalidation | Live six-zone load and two fee/total combinations verified; disabled-zone live mutation pending |
| C11-003 | Safe loading, query-error, no-zone, stale selection, and changed-fee behavior | Query-specific feedback, retries, ID reconciliation, current-query fee lookup, pre-submit refetch | Deterministic model/source tests passed; live error/disable/fee-mutation fixtures not run |
| C11-004 | Guest delivery form with optional email/landmark and accessible inline validation | React Hook Form, shared Zod schema, labelled controls, autocomplete, field errors, preserved values | Empty required-field focus/errors and valid submission verified; email/landmark cases unit tested |
| C11-005 | Public live payment settings and only enabled method choices | Safe `checkout_payment_options` query, normalized enabled-method filter, focus/interval/pre-submit refresh | Both live methods displayed; both/one/zero method matrices unit tested; live settings mutation pending |
| C11-006 | Admin delivery and checkout configuration | Protected admin pages, centralized queries/mutations, kobo conversion, final-method UI guard | Admin build and static authorization assertions passed; authenticated live mutation not performed |
| C11-007 | Cart review with current variants/add-ons/quantity/pricing/status/nutrition | Existing Cycle 9 hydration/subtotal/nutrition reused in checkout presentation | Live standard cart review and nutrition verified; grouped/add-on detail matrix covered by prior hydration tests |
| C11-008 | Meal-plan schedule review with dates/slots/count/pricing/nutrition | Existing Cycle 10 hydrated summary and serialized schedule reused | Live 5-day one-slot review and 2–7 day serialization/model coverage passed |
| C11-009 | Estimated subtotal + current delivery fee = estimated total, never authoritative | Safe integer-kobo addition and explicit estimate disclosure | ₦8,500 + ₦1,800 = ₦10,300 and ₦2,500 + ₦1,500 = ₦4,000 verified live |
| C11-010 | Clean Cycle 12-compatible selection contract | Shared cart/meal-plan contract builder and discriminated Zod schema; no trusted prices/totals | Cart and scheduled meal-plan contract tests passed |
| C11-011 | Mock-only Paystack and WhatsApp submission with duplicate prevention | Pure mock adapter, pre-submit revalidation, React Hook Form submitting state | Both intents completed live; basket/plan remained present; no external navigation occurred |
| C11-012 | No direct order/payment writes or early Cycle 12–14 integration | Checkout browser API reads only; mock adapter has no Supabase client | Boundary tests and source review passed |
| C11-013 | Responsive and accessible checkout | Semantic headings/fieldset/radios, associated errors, focus recovery, stacked mobile action, sticky desktop review | 320/390/1280px checks had no horizontal overflow; mobile crowding found and fixed; browser error log empty |
| C11-014 | Narrow active-admin checkout-settings permission | Migration grants only three singleton update columns to authenticated users plus active-admin RLS policy | Static migration tests passed; local reset failed while inspecting the legacy stack and pgTAP could not connect to local Postgres; hosted migration application not run |

Cycle 11 post-implementation verification passed lint, all 89 Node tests (including the focused eight-test suite), both production builds, and connected browser checks. The local Supabase reset reported a legacy-stack inspection error and pgTAP could not connect to `127.0.0.1:54322`, so database execution remains pending. No permanent order, order item, payment, Paystack initialization, WhatsApp window, or source clearing was introduced.

## Cycle 12 server-authoritative order engine

| Requirement ID | Required | Implemented | Verification status |
|---|---|---|---|
| C12-001 | Public guest checkout through a secure backend, never direct inserts | JavaScript `create-order` Edge Function with backend-only service-role client | Focused handler/security source tests passed |
| C12-002 | Exact Cycle 11 cart and meal-plan runtime contract | Canonical shared Zod discriminated union; strict nested selections and consecutive 2–7 day schedule | Cart/plan/empty/arbitrary-slot/date tests passed |
| C12-003 | Reject browser price, totals, nutrition, and availability authority | Strict root/configuration objects accept stable selections only | Financial-field matrix and explicit ₦8,000→₦80 attack passed by rejection |
| C12-004 | Validate positive whole database-safe quantities and unique add-ons | PostgreSQL-integer upper bound plus duplicate-ID refinement | 0, negative, decimal, NaN, string, overflow, and duplicate cases passed |
| C12-005 | Re-read current products and enforce orderability | Batched service-role product query; exact `available` state and standard price required | Missing/sold-out/hidden/archived/unavailable/price-pending tests passed |
| C12-006 | Enforce standard/grouped variant rules and relationships | Standard requires null; grouped requires current available priced child variant | Missing/cross-product/hidden/sold-out variant attacks passed |
| C12-007 | Revalidate add-ons and compatibility | Batched add-on/assignment reads; current availability, price, and parent assignment required | Cross-product and unavailable add-on attacks passed |
| C12-008 | Revalidate delivery zone and current fee | Exact stable-ID lookup plus active-state/current-kobo check | Inactive-zone and changed-fee tests passed |
| C12-009 | Revalidate current payment settings | Private singleton read maps only known Zod payment methods to enabled flags | Disabled and unknown payment-method tests passed |
| C12-010 | Calculate authoritative integer-kobo totals | Safe base + add-ons, quantity multiplication, subtotal, one delivery fee, total | Exact cart/group/meal-plan/overflow tests passed |
| C12-011 | Calculate authoritative complete/partial/unavailable nutrition | Runtime-neutral Cycle 8 engine uses current base/variant/add-on rows and quantity | Three-state and quantity aggregation tests passed |
| C12-012 | Persist customer, delivery, method, totals, and schedule | Existing Cycle 2 order/order-item/add-on snapshot columns fully populated | Snapshot construction tests passed; live database execution pending local runtime |
| C12-013 | Atomic graph persistence | Service-role-only `create_order_atomic(jsonb,jsonb)` inserts order and all children in one function call | Static migration checks passed; pgTAP success/failure rollback tests added, runtime pending |
| C12-014 | Unique friendly server-generated reference | Private sequence emits `NUE-######`; existing unique constraint remains collision guard | Static strategy check passed; database concurrency/runtime check pending |
| C12-015 | Historical snapshot independence | Names, base/add-on prices, nutrition, quantity, zone fee/name, and schedule copied at purchase time | In-memory mutation immutability test passed; pgTAP snapshot read added, runtime pending |
| C12-016 | Separate safe initial statuses and no payment row | RPC hard-codes `unpaid` payment and `pending` fulfilment; generic engine creates no payment | Unit/source review passed |
| C12-017 | Preserve direct-write RLS protections | No grants changed; RPC execution revoked from public/anon/authenticated and granted only to service role | Static checks passed; pgTAP privilege assertions added, runtime pending |
| C12-018 | Safe method/JSON/CORS/errors/logging | Thin handler returns structured errors and logs code/stage only | OPTIONS/GET/bad JSON/Zod/success handler tests passed |
| C12-019 | Authoritative future-integration response | Persisted identity/status plus totals, zone, items, snapshots, nutrition, and full schedule | Engine response tests passed |
| C12-020 | Preserve Cycle 13+ boundary | Storefront submission remains mocked; no Paystack call/payment row or WhatsApp URL/navigation | Source-boundary tests passed |

Cycle 12 post-implementation static verification passed lint, all 102 Node tests (including the focused 13-test Cycle 12 suite), and both storefront/admin production builds. Local `db:reset` reached the previously recorded legacy-service inspection error, pgTAP could not connect to `127.0.0.1:54322`, and the Edge runtime could not start because Docker/Podman is unavailable. Consequently the migration, atomic rollback, direct credential attacks, live function calls, permanent database orders, and database-backed snapshot mutation/concurrency checks are implemented and covered by deterministic/static or pending pgTAP tests but are not claimed as runtime-verified. No historical cycle gate was reopened.

## Cycle 13 WhatsApp checkout

| Requirement ID | Required | Implemented | Verification status |
|---|---|---|---|
| C13-001 | Permanent order before WhatsApp opens | Storefront awaits `create-whatsapp-order`; the endpoint awaits the Cycle 12 engine before building a handoff | Focused order-before-handoff event test passed; live Edge/browser execution pending |
| C13-002 | WhatsApp-only backend entrypoint | Dedicated anonymous JavaScript Edge Function rejects every method except exact `whatsapp` | Direct Paystack attack test passed without invoking order creation |
| C13-003 | Recheck current WhatsApp enabled state | Dedicated orchestration delegates to Cycle 12 current-settings validation and maps its disabled result to `WHATSAPP_DISABLED` | Direct crafted disabled-method handler test passed with no order/handoff response; live admin race pending |
| C13-004 | Reuse authoritative catalog, pricing, delivery, nutrition, snapshots, and atomic persistence | `createWhatsappOrder` calls `createAuthoritativeOrder`; no WhatsApp-specific copies of Cycle 12 business logic | Source review plus full Cycle 12 regression suite; live database execution pending |
| C13-005 | Persist exact WhatsApp/unpaid/pending state without fake payment | Cycle 12 request carries `whatsapp`; atomic RPC hard-codes `unpaid` and `pending`; no payment row is created | Focused response assertions and existing RPC/source tests passed; database record inspection pending |
| C13-006 | Deterministic authoritative cart message | Server formatter consumes the engine response and emits reference, snapshot items/variants/add-ons/quantity, delivery, zone, subtotal, fee, total, and unpaid status | Cart, no-add-on, quantity, currency, no-ID, and snapshot-content tests passed |
| C13-007 | Preserve meal-plan schedule | Formatter uses returned schedule dates/slots and purchase-time item snapshots with readable slot labels | Two-day and seven-day formatter tests passed |
| C13-008 | Approved backend recipient and safe URL encoding | Backend-only `NUEDE_WHATSAPP_NUMBER` normalization; `https://wa.me/<digits>?text=<encoded>` | Recipient valid/invalid matrix and exact URL round-trip tests passed; production number must be configured by deployer |
| C13-009 | Order-created handoff UI, accurate status language, and accessible retry | Distinct responsive state shows reference, authoritative total, unpaid/pending labels, and secure external link | Lint/build/source assertions passed; viewport, keyboard, popup, and WhatsApp-app manual checks pending |
| C13-010 | Duplicate-submission and retry safety | Existing form lock covers the request; successful state replaces the form; retry is a plain link to the returned URL | Static sequence and opener retry tests passed; live rapid-double-click check pending |
| C13-011 | Correct cart/plan clearing | Source is cleared only after a returned permanent order (including explicit persisted-order handoff recovery); handoff lives in separate React state | Static order-of-operations assertions passed; live localStorage timing checks pending |
| C13-012 | Honest order-created/handoff-failed recovery | Post-persistence formatter failure preserves and returns minimal order reference/status/total; frontend clears completed source and shows recovery | Handler recovery and safe-logging tests passed |
| C13-013 | Reject manipulation and preserve RLS | Strict Cycle 12 schema rejects client totals; existing service-role-only RPC and table RLS remain unchanged | Direct ₦8,000 crafted endpoint request and existing Cycle 12/RLS tests passed; pgTAP/runtime attacks pending |
| C13-014 | Keep Paystack and later-cycle boundaries | Historical Cycle 13 checkpoint kept Paystack mocked; Cycle 14 now replaces only that branch while preserving the WhatsApp implementation and excluding Cycle 15+ | Cycle 13 regression assertions updated and passed |

Cycle 13 requires no database migration. Static verification covers the shared-engine reuse, direct disabled-WhatsApp bypass, price-field attack, method pinning, deterministic cart and meal-plan messages, URL encoding, recipient validation, handoff failure recovery, source-clearing sequence, retry behavior, RLS source boundaries, lint, the complete Node suite, and both production builds. Database-backed Edge execution, permanent record/snapshot inspection, live admin-disable and stale-catalog races, and connected responsive/keyboard/popup checks remain environment-dependent and must not be reported as passed until run.

## Cycle 14 secure Paystack payments

| Requirement ID | Required | Implemented | Verification status |
|---|---|---|---|
| C14-001 | Reuse server-authoritative validation/pricing | Paystack orchestration injects only atomic attempt persistence into `createAuthoritativeOrder`; strict selection contract includes no prices | Focused initialization/source tests passed |
| C14-002 | Reject disabled Paystack before persistence | Shared engine reads current private checkout singleton before snapshot persistence | Deterministic disabled-method test passed; live admin race pending local runtime |
| C14-003 | Permanent order and attempt | `create_paystack_order_atomic` creates the order graph, changes order payment to pending, and inserts the expected-kobo attempt in one transaction | pgTAP added; runtime pending |
| C14-004 | Secure provider initialization | Backend secret, authoritative amount/email/reference, configured callback, validated response, exact Paystack checkout host | Mocked provider request/response/error tests passed |
| C14-005 | Raw signed webhook | Original text body is HMAC SHA-512 checked with `x-paystack-signature` before parsing/mutation | Valid/invalid raw-body tests passed |
| C14-006 | Reference/amount/currency integrity | Unique stored references and atomic RPC compare observed amount and NGN currency to the trusted attempt | JavaScript boundary plus pgTAP mismatch tests added; pgTAP runtime pending |
| C14-007 | Idempotent atomic reconciliation | Payment/order rows are locked and updated together; already verified paid notifications return an explicit no-op; fulfilment is untouched | Source/unit assertions passed; pgTAP duplicate test runtime pending |
| C14-008 | Trusted result verification | Known pending references are verified server-to-server; unknown/malformed references fail safely; provider outage maps to confirming | Focused handler/orchestration tests passed |
| C14-009 | Four-state result UI | TanStack Query hook provides bounded automatic refresh and confirming/successful/pending/failed presentations | Model/source/build tests passed; connected browser/payment acceptance pending |
| C14-010 | Fake redirect resistance | Page reads only `reference`; success comes solely from backend normalized status | Redirect-state unit test passed |
| C14-011 | Verified post-payment WhatsApp | Backend builds message from trusted order reference, provider reference, and amount; no checkout-setting gate is consulted | Formatter/normalization test passed; live app handoff pending |
| C14-012 | Preserve secrets, RLS, and scope | No frontend secret/direct payment writes; service-role-only RPCs; no fulfilment mutation or Cycle 15+ UI | Lint/static review passed; database privilege test runtime pending |

Cycle 14 post-implementation verification passed the focused 18-test Paystack suite, the complete 133-test Node suite, lint, storefront production build, admin regression build, and `git diff --check`. A local browser check of `/payment?status=success` rendered the invalid-reference failed state rather than trusting the fake success flag. The React quality review also corrected the result page to one document-level heading and wrapper-based loading animation.

`npx supabase status` was attempted and reported that neither Docker nor Podman is installed, so migration replay, the 25-assertion Cycle 14 pgTAP file, database-backed Edge execution, and live disabled-method/concurrency checks were not run. No `supabase/functions/.env`, Deno runtime, or Paystack test credentials are present, so hosted checkout, signed live webhook delivery, cart/meal-plan test-mode payments, and real post-payment WhatsApp opening were not run and are not claimed as passed.

## Cycle 15 admin order management

| Requirement ID | Required | Implemented | Tested |
|---|---|---|---|
| C15-001 | Private scalable order browsing | `list_admin_orders` active-admin RPC, 20-row pagination, total count, newest-first deterministic ordering | Domain/static Node tests; pgTAP privileges added |
| C15-002 | Reference/customer/phone/Paystack search | One server-side case-insensitive search predicate including payment existence | Static SQL coverage added; live database run pending |
| C15-003 | Combined fulfilment/payment/method/type/date filters | RPC parameters plus resettable URL-backed admin filter bar | Source assertions and admin build |
| C15-004 | Responsive operational list states | Desktop semantic table, mobile cards, loading/refresh/error/no-orders/no-matches states | Lint/build and source checks |
| C15-005 | Complete deep-linked detail | One embedded order/items/add-ons/payments query; identity, customer, delivery, totals and timestamps | Source/architecture tests and admin build |
| C15-006 | Immutable historical snapshots | Detail renders stored names, variant, add-ons, kobo values and nutrition; no catalog lookup/repricing | Source-boundary tests |
| C15-007 | Permanent meal-plan schedule | Stored plan range plus item `scheduled_for`/`meal_slot` assignments | Source assertions; live record pending |
| C15-008 | Trusted payment detail/separation | Read-only order/payment statuses, amounts, references, verification/provider timestamps | Source assertions; Cycle 14 regressions retained |
| C15-009 | Forward-only fulfilment workflow | Shared domain helper and equivalent locked database validation | Domain transition suite plus pgTAP assertions added |
| C15-010 | Safe cancellation | Pre-dispatch only, confirmation dialog, terminal state, no refund/payment mutation | Domain/static tests plus pgTAP assertions added |
| C15-011 | Stale/error/mutation UX | Mutation lock, Query invalidation, 30-second refetch, success/error toasts | Source/build verification; multi-admin live test pending |
| C15-012 | Authorization, RLS and audit | Active-admin RPC checks, direct table writes still denied, JWT-derived actor, existing audit table | Static security checks plus pgTAP privileges added |
| C15-013 | Preserve Cycle 16+ boundary | No revenue metrics, charts, aggregates, or analytics work | Source and changed-file review |

Cycle 15 post-implementation verification passed the focused 8-test order-management suite, the complete 141-test Node suite, repository lint, both production builds, and `git diff --check`. `npx supabase status` reported `docker: command not found (podman also not found)`, so migration replay, the 25-assertion Cycle 15 pgTAP file, database/RLS execution, crafted live transitions, and authenticated multi-admin/manual flows were not run. The deterministic tests validate transition parity and source boundaries; they do not substitute for applying the migration and exercising active, inactive, anonymous, and concurrent-admin personas against PostgreSQL.

## Cycle 16 first-party sales analytics

| Requirement ID | Required | Implemented | Tested |
|---|---|---|---|
| C16-001 | Revenue from verified paid orders only | `private.analytics_eligible_sales` requires paid order state plus exact verified Paystack amount/currency evidence | Source assertions passed; 39-assertion pgTAP fixture added, runtime pending |
| C16-002 | Duplicate-payment protection | Lateral earliest-verification reduction produces one canonical row per order before every aggregate | Source assertion passed; duplicate-paid-row fixture added, runtime pending |
| C16-003 | KPI reconciliation | Revenue, distinct paid orders, rounded integer-kobo AOV, and top-level item quantity from one range population | Formatting/source tests passed; ₦30,000 / 2 / ₦15,000 / 5 pgTAP reconciliation added |
| C16-004 | Daily revenue/orders | Private `daily_sales` plus RPC zero buckets support both Recharts trends | Source/UI/build tests passed; Lagos boundary fixture pending database runtime |
| C16-005 | Product and ranking | Historical product label/ID, quantity, base-line revenue, revenue and quantity ranks | Source/UI tests passed; historical current-price-change fixture added |
| C16-006 | Variant sales | Historical parent/variant labels and stable IDs where persisted, quantity, base revenue | Source/UI tests passed; grouped meal-plan fixture added |
| C16-007 | Add-on sales | Purchased add-on label/ID, parent item quantity, purchased-price revenue | Source/UI tests passed; exact quantity/revenue fixture added |
| C16-008 | Delivery zones and payment methods | Historical zone order/revenue/fee totals and canonical method revenue/share | Source/UI tests passed; multi-zone/payment aggregate fixtures added |
| C16-009 | Date ranges and timezone | Today/7/30/90/custom; inclusive Lagos dates based on trusted `verified_at` | Preset/custom unit tests passed; database boundary/reversed-range tests pending runtime |
| C16-010 | Dashboard and Analytics UX | Real KPIs, responsive Recharts, semantic tables, loading/empty/error/retry states | Static UI tests, lint, and admin production build passed |
| C16-011 | Admin-only privacy boundary | One active-admin RPC; private views revoked; aggregate payload contains no customer/payment PII | Security source tests passed; anonymous/active-admin pgTAP checks pending runtime |
| C16-012 | Preserve commerce and later-cycle scope | Read-only analytics API, shared formatter, no storefront/payment/fulfilment writes, no Cycle 17/18 work | Full 150-test suite, Cycle 14/15 focused regressions, both builds, and changed-file audit passed |

Cycle 16 post-implementation verification passed the focused 9-test analytics suite, the complete 150-test Node suite, repository lint, the 18-test Cycle 14 payment suite, the 8-test Cycle 15 order-management suite, both production builds, and `git diff --check`. The builds required a sandbox-relaxed rerun after esbuild was denied parent-directory access; both reruns passed with only the existing large-chunk advisory.

`npx supabase status` was attempted and reported `docker: command not found (podman also not found)`. Migration replay, the 39-assertion Cycle 16 pgTAP file, live RLS/RPC execution, SQL reconciliation against PostgreSQL, and authenticated browser acceptance were therefore not run and are not claimed as passed. Deterministic tests validate the formulas, query boundaries, date presets, UI states, and source architecture; they do not substitute for applying the migration.
