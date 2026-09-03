# Requirement traceability

This ledger maps requirements to implementation and evidence. It is updated during each cycle's inspection and implementation.

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
