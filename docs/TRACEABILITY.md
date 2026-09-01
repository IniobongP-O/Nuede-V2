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
