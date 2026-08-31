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
