# Feature authority and roadmap

## Cycle 18 — final hardening, external launch blocked

[Current verification report](CYCLE18.md), [all 212 numbered requirements](FEATURE-MATRIX.md), and [deployment runbook](DEPLOYMENT.md) supersede historical “not begun” statements below. Cycles 0–17 remain accepted. Current hosted schema/function gaps are recorded explicitly and no final launch proof is claimed.

Completed the documented dashboard recent-orders list, total/cancelled/failed operational counts, and direct-order versus meal-plan verified-sales breakdown. Operational counts follow order-created dates and are not revenue. Payment settings are editable by owner/admin and read-only for editors, with server attribution/audit. These are completions of existing modules, not new product scope. The all-212 feature ledger records implementation locations and actual test limits.


## Current Cycle 17 implementation

Public published-only testimonial carousel; protected testimonial creation/editing/rating/publication/deletion; guest feedback with six subjects; private paged admin feedback with search and subject/rating filters; editable feedback-to-unpublished-testimonial copying; completed rotating hero, About, live featured meals, FAQ, nutrition note, configurable contact/footer/social content are implemented. Loading, empty, failure, validation, responsive and accessibility states are included.

[Cycle 17 report](CYCLE17.md) distinguishes passing available verification from unavailable live database/Auth/RLS checks and lists missing real business contact values. Cycles 0–16 were accepted as the foundation for this work. Cycle 18 is not implemented; the historical cycle notes below remain historical records.

## Source precedence

Development decisions use this authority order:

1. Feature, business, and technical specifications.
2. Explicit instructions given during development.
3. UI/UX mockups.
4. Implementation assumptions.

The complete feature specification defines what Nuede must do. Mockups define how it should look and feel. A missing mockup never removes a specified feature, and mockup sample data never becomes a business rule unless the specification requires it.

## Scope discipline

Only the currently approved cycle may be implemented. Supporting UI may expose documented functionality when its cycle arrives, but undocumented major features are prohibited.

Status terms used by the project are:

- `Planned` - assigned to a future cycle.
- `In progress` - implementation has started.
- `Implemented` - code exists but has not completed verification and acceptance.
- `Verified` - objective checks pass.
- `Accepted` - the user has manually approved the cycle.

## Development roadmap

| Cycle | Scope |
|---|---|
| 0 | Repository and engineering foundation |
| 1 | Storefront/admin shells and design foundations |
| 2 | Supabase database foundation |
| 3 | Supabase Auth and Row Level Security |
| 4 | Admin catalog management |
| 5 | Images, grouped variants, and add-ons |
| 6 | Live storefront menu |
| 7 | Product details and customization |
| 8 | Nutrition engine and local favorites |
| 9 | Shopping cart |
| 10 | Multi-day meal planner |
| 11 | Delivery and checkout frontend |
| 12 | Server-authoritative order engine |
| 13 | WhatsApp checkout |
| 14 | Paystack payments |
| 15 | Admin order management |
| 16 | First-party sales analytics |
| 17 | Testimonials, feedback, and storefront content |
| 18 | Security hardening, QA, deployment, and launch |

The specification's 212 numbered product features remain planned. Cycle 0 implements none of them. Relevant numbered requirements must be expanded in `TRACEABILITY.md` during each cycle's inspection before that cycle is considered complete.

## Cycle 1 checkpoint

Cycle 1 is the known-good starting checkpoint for Cycle 2: `65eadef feat: build storefront and admin application shells`.

Implemented foundations:

- independent storefront and admin routing;
- storefront header, responsive navigation, basket placeholder, content layout, and footer;
- admin login shell, sidebar, top bar, mobile navigation, and content layout;
- shared brand tokens with application-owned React components;
- buttons, form controls, cards/panels, tables, badges, loading/error/empty states, native dialogs, and toasts;
- fixture-backed page shells and branded Not Found pages;
- responsive and keyboard/focus foundations.

Every displayed menu item, price, order, metric, delivery area, testimonial, feedback record, payment state, and planner slot is mock content. A visible page or control does not mark its future business feature implemented.

## Cycle 2 implementation status

The Supabase database-foundation implementation now exists and is awaiting separate review, objective verification, and manual acceptance.

Implemented storage foundation:

- categories, products, grouped variants, add-ons, and relational compatibility;
- delivery zones and a protected checkout-settings singleton;
- admin-user/Auth linkage structure and durable audit storage shape;
- permanent order, item, item-add-on, and payment history structure;
- immutable product, variant, add-on, delivery, price, and nutrition snapshot columns;
- testimonial and private-feedback tables;
- deterministic local seed data, database constraints, indexes, and pgTAP tests.

Not implemented by Cycle 2:

- RLS or authentication behavior;
- admin catalog/content/order CRUD;
- frontend Supabase queries or replacement of Cycle 1 fixtures;
- Storage upload behavior;
- cart, planner, checkout, order creation, WhatsApp, Paystack, fulfilment, or analytics workflows.

The presence of a table is not implementation evidence for its later feature workflow.

## Cycle 3 checkpoint

Supabase admin authentication and the database authorization foundation were reviewed and accepted at checkpoint `7a88c15 feat: implement admin authentication and RLS`. The checkpoint report recorded that local Docker-backed database execution was unavailable in that environment.

Implemented in Cycle 3:

- email/password admin login with no registration flow;
- supported persistent Supabase browser sessions and logout;
- protected admin routes with initialization, denial, inactive-account, and error states;
- active `admin_users` authorization supporting owner/admin/editor;
- RLS and explicit grants across every Cycle 2 business table;
- filtered public reads, private feedback, and anonymous feedback submission;
- protected order/payment/checkout/audit mutation boundaries;
- pgTAP, static architecture, and direct local Auth/RLS attack tests.

Still planned:

- admin catalog and content CRUD interfaces;
- live storefront queries and Realtime behavior;
- images, grouped-product editing, and add-on management UI;
- cart, planner, checkout, server-authoritative orders, WhatsApp, Paystack, fulfilment, and analytics;
- feedback/testimonial business workflows and production provisioning.

RLS readiness does not mark any of those later workflows implemented.

## Cycle 4 implementation status

Implemented in Cycle 4:

- live admin listing for all categories and standard products;
- category creation, rename, display order, enable, and disable controls;
- standard-product creation and editing for name, category, description, NGN price converted to integer kobo, optional nutrition, availability, and visibility;
- product name search plus category and database-status filters;
- quick available, sold-out, hide, show, archive, and restore operations;
- responsive desktop table and narrow-screen product cards;
- centralized Supabase API operations with TanStack Query caching and invalidation;
- React Hook Form plus shared Zod validation and database constraints;
- database-owned audit events for product create, edit, price, status, archive, and restore actions;
- loading, empty, error, pending, success, destructive-confirmation, and validation states.

Deliberately not implemented in Cycle 4:

- product images, Storage, grouped products, variants, and add-ons (Cycle 5);
- live storefront catalog consumption or Realtime (Cycle 6);
- permanent product deletion (Spec 121 is absent from the Cycle 4 field-guide scope; archive/restore remains the approved lifecycle until a later cycle explicitly assigns deletion);
- any order, checkout, payment, analytics, content, or later-cycle workflow.

The implementation is not `Verified` until the new migration, pgTAP suite, direct local catalog/RLS utility, and manual UI/PostgreSQL acceptance sequence run against local Supabase.

## Cycle 5 implementation status

Implemented in Cycle 5:

- standard-product, grouped-parent, and variant images with preview, validation, browser optimization, safe replacement, and Storage-path persistence;
- reproducible public-read/admin-write `product-images` bucket configuration and policies;
- grouped meal creation, editing, search/filter, status lifecycle, shared add-ons, selection mode, and valid default variant configuration;
- independent variant creation/editing/removal, stable IDs, integer-kobo prices, nutrition, images, visibility, sold-out state, and accessible reorder buttons;
- reusable add-on library CRUD, availability, nutrition, integer-kobo prices, standard-product compatibility, and grouped shared assignments;
- database safeguards preventing orderable groups without an orderable child, invalid defaults, final-valid-child invalidation, and cross-group variant movement;
- atomic variant reordering and product/add-on assignment replacement;
- trusted audit coverage for grouped settings, variants, add-ons, assignments, and image-reference changes;
- shared Zod/domain rules, static/unit tests, pgTAP coverage, and a local-only direct RLS/Storage lifecycle utility.

Deliberately not implemented in Cycle 5:

- live storefront Supabase catalog queries or Realtime subscriptions (Cycle 6);
- customer variant/add-on selection or Add to Cart configuration (Cycle 7+);
- cart, planner, checkout, orders, payments, fulfilment, analytics, or later-cycle workflows.

The implementation is not `Verified` or ready for its checkpoint until Docker-backed migration reset, pgTAP, direct RLS/Storage checks, and the documented manual admin/PostgreSQL/Storage acceptance sequence pass.

## Cycle 6 implementation status

Implemented in Cycle 6:

- live anonymous storefront category and product reads through a feature-scoped Supabase API;
- TanStack Query caching, retry/refetch behavior, stable query keys, and selective catalog Realtime invalidation;
- enabled database-driven category controls and an application-only All view;
- standard and grouped menu models with variant-aware orderability, display prices, image fallback, and honest nutrition completeness;
- live product cards for available, sold-out, price-pending, and unavailable states while hidden/archived products remain excluded;
- case-insensitive name, description, and category search composed with category, grouped, available, high-protein, and complete-nutrition filters;
- deliberate skeleton, query-error/retry, empty-menu, and no-results states;
- responsive overflow/wrapping/grid behavior plus semantic labels, pressed states, focus support, image alternatives, and non-color status text;
- focused unit/architecture tests and Cycle 6 traceability.

Deliberately not implemented in Cycle 6:

- product detail, variant choice, add-on choice, or normalized orderable configurations (Cycle 7);
- shared nutrition calculations, favorites, or Saved Meals (Cycle 8);
- cart, planner, checkout, orders, payments, admin orders, analytics, or later-cycle workflows.

Cycle 6 automated verification and any environment-limited manual status are recorded in `TRACEABILITY.md`; implementation does not imply unperformed live Supabase or viewport checks.

## Cycle 7 implementation status

Implemented in Cycle 7:

- live meal details opened from explicit controls on every standard and grouped menu card;
- large responsive image, description, price, availability, nutrition, add-on, and quantity presentation;
- grouped variant radios using stable IDs, configured-default initialization, and explicit-choice behavior without first-row fallback;
- variant-specific image, description, integer-kobo price, nutrition, and availability updates;
- product-compatible multiple add-on selection with stable IDs and live invalid-selection reconciliation;
- item-level derived price and quantity-aware nutrition display with honest partial-data indicators;
- reusable Zod identity validation plus catalog-aware product, variant, add-on, availability, compatibility, uniqueness, and quantity validation;
- normalized `{ productId, variantId, addonIds, quantity }` output through an `onConfigured` boundary with no trusted price or nutrition fields;
- native modal semantics, focus containment/restoration, Escape close, labelled form controls, non-color selection/state indicators, and mobile full-screen behavior;
- add-on/assignment Realtime publication and existing-query invalidation without new public grants;
- focused domain/architecture tests, lint, and successful storefront/admin production builds.

Deliberately not implemented in Cycle 7:

- shared cross-surface nutrition totals, Saved Meals, or favorites (Cycle 8);
- cart storage, persistence, merging, drawer, subtotal, or cart nutrition (Cycle 9);
- planner, checkout, authoritative order pricing, payments, fulfilment, analytics, or later-cycle workflows.

Connected-project verification loaded the live seven-product menu and exercised standard customization, grouped default selection, multiple add-ons, quantity, dynamic price/nutrition, unavailable/sold-out/price-pending states, Escape close, focus restoration, and 320/390/768/1280px layouts. Axe reported zero WCAG A/AA violations in the open dialog. The connected catalog has no explicit-required group and no second selectable variant; those paths remain automated-test verified rather than live-data verified. No live admin mutation was made, so two-browser Realtime reconciliation and remote migration publication state remain pending.

## Cycle 8 implementation status

Implemented in Cycle 8:

- one framework-independent nutrition engine for standard meals, selected grouped variants, add-ons, quantity, generic totals, cart-style fixtures, plan days/slots, explicit-duration daily averages, and centralized formatting;
- machine-readable complete, partial, and unavailable results with field-level completeness and null-preserving arithmetic;
- Cycle 7 detail nutrition and Cycle 6 menu completeness/formatting delegated to that shared engine;
- device-local product-level Saved Meals using the validated `nuede:v2:saved-meals` UUID list;
- one Saved Meals provider for immediate same-tab updates and lightweight cross-tab `storage` synchronization;
- accessible save/remove controls on menu cards and product details with semantic pressed state and existing-toast feedback;
- `/saved` live-menu reconciliation, grouped detail reopening, current sold-out/price-pending states, stale/private exclusion, removal, confirmed Clear All, query feedback, and a purposeful empty state;
- responsive one/two/three-column layouts inherited from live menu cards and keyboard-operable native controls/dialogs;
- deterministic nutrition/persistence/model/source tests plus connected-browser acceptance checks.

Deliberately not implemented in Cycle 8:

- customer accounts, cloud favorites, full product/configuration snapshots, or a favorites database table;
- cart context, storage, drawer, line merging, subtotals, checkout handoff, or any other Cycle 9 behavior;
- planner dates, slots UI, state, persistence, summary UI, or any other Cycle 10 behavior;
- checkout, orders, payments, fulfilment, analytics, and later-cycle workflows.

Cycle 8 added no database migration and did not alter RLS. The cart and meal-plan nutrition APIs are domain preparation only.

## Cycle 9 implementation status

Implemented in Cycle 9:

- anonymous cart state for normalized standard/grouped configurations, variants, add-ons, and positive whole quantities;
- deterministic identity using product, variant, and sorted unique add-on IDs, with identical configurations merged and quantity excluded from identity;
- validated versioned `nuede:v2:cart` persistence, malformed-data recovery, duplicate restoration merging, and lightweight cross-tab updates;
- Cycle 7 Add to basket and cart reconfiguration flows using the existing product-detail validation and form;
- live total-quantity header badge plus an accessible responsive native basket dialog;
- current product, variant, add-on, price, image, availability, and nutrition hydration through the existing TanStack Query menu cache;
- independent increment, decrement-at-minimum-one, remove, confirmed clear, edit/replace, and merge-on-edit behavior;
- integer-kobo unit price, line total, estimated subtotal, and delivery-at-checkout wording with no authoritative price persistence;
- Cycle 8 nutrition totals with quantity/add-on/variant semantics and partial/unavailable warnings;
- generic stale/private product lines, current sold-out/price-pending states, invalid-variant/add-on detection, removal, and blocked checkout readiness;
- deterministic cart/storage/hydration/source tests plus connected-browser accessibility and responsive checks.

Deliberately not implemented in Cycle 9:

- customer accounts, database carts, cloud restore, or cross-device synchronization;
- Cycle 10 planner dates, slots, drag/drop, plan persistence, or plan checkout;
- Cycle 11 delivery selection, customer form, payment-method selection, or completed checkout behavior;
- Cycle 12 authoritative repricing, order creation, order items, or Edge Function submission;
- Paystack, WhatsApp ordering, fulfilment, analytics, and later-cycle workflows.

Cycle 9 added no database migration and did not alter grants or RLS. Basket prices remain display estimates; a future trusted server boundary must re-read catalog values and calculate authoritative totals.

## Cycle 11 implementation status

Implemented in Cycle 11:

- one checkout experience with refresh-stable explicit cart and meal-plan sources;
- live active delivery areas and current integer-kobo delivery fees through centralized TanStack Query data access;
- guest delivery details using React Hook Form, shared Zod validation, inline errors, and browser autofill attributes;
- live public Paystack/WhatsApp availability with enabled-only choices, invalid-selection reconciliation, and pre-submit refresh;
- cart and scheduled meal-plan reviews reusing the accepted hydration, subtotal, and nutrition engines;
- explicitly estimated subtotal, delivery, and total presentation with no financial values in the submission contract;
- a discriminated, selection-only cart/meal-plan contract for the future Cycle 12 server engine;
- a pure mocked submission boundary for Paystack and WhatsApp intent that creates nothing and clears nothing;
- defensive loading, error, empty, unavailable-selection, zero-zone, and zero-payment-method states;
- minimal protected admin delivery and checkout-settings controls plus a scoped active-admin singleton-update migration;
- responsive checkout layout and semantic form, radio, focus, status, and review structure.

Deliberately not implemented in Cycle 11:

- server-authoritative pricing, permanent orders, order references, item snapshots, or an order Edge Function (Cycle 12);
- WhatsApp order creation, final message construction, or opening WhatsApp (Cycle 13);
- Paystack initialization, redirect, verification, webhook, payment records, or payment-result states (Cycle 14);
- customer accounts, persisted customer profiles, or long-lived local storage of delivery PII;
- admin orders, fulfilment, analytics, content completion, or deployment work from later cycles.

Frontend prices remain review estimates. The future server must independently load the selected catalog records, delivery zone, fee, and payment settings before creating an order.

## Cycle 12 implementation status

Implemented in Cycle 12:

- a public guest-checkout `create-order` Supabase Edge Function written entirely in JavaScript;
- the exact Cycle 11 cart/meal-plan selection contract as the strict authoritative Zod boundary, including consecutive schedule validation;
- batched service-role reads of selected products, variants, add-ons, compatibility assignments, delivery zone, and checkout settings;
- current product/variant/add-on availability and relationship validation, with standard/grouped variant rules and duplicate add-on rejection;
- integer-kobo base, configured-unit, line, subtotal, one-per-order delivery, and final-total calculations that never consume browser prices or totals;
- server-side complete/partial/unavailable nutrition using the runtime-neutral Cycle 8 domain engine;
- purchase-time product, variant, add-on, quantity, nutrition, delivery, customer, payment-intent, and meal-slot/date snapshots;
- private sequence-backed `NUE-######` references and one service-role-only PostgreSQL RPC for atomic order/item/add-on insertion;
- safe structured HTTP errors, method/JSON/CORS handling, and PII-minimal failure logging;
- a future-integration response containing persisted identity/status plus authoritative totals, items, nutrition, and schedule.

Deliberately not implemented in Cycle 12:

- customer-facing replacement of Cycle 11's mocked submission boundary;
- WhatsApp message/URL/navigation or completion behavior (Cycle 13);
- Paystack initialization, payment rows, authorization URLs, callbacks, verification, or webhooks (Cycle 14);
- admin fulfilment/order management, analytics, or later-cycle workflows.

## Cycle 13 implementation status

Implemented in Cycle 13:

- a dedicated JavaScript `create-whatsapp-order` Edge Function that accepts only the WhatsApp method;
- reuse of the Cycle 12 authoritative order engine, including the latest backend payment-setting check and atomic permanent persistence;
- backend-only international WhatsApp recipient configuration and deterministic encoded `wa.me` handoff generation;
- cart messages with permanent reference, purchase-time product/variant/add-on names, quantities, delivery snapshot, zone, and authoritative totals;
- meal-plan messages preserving duration, dates, readable meal slots, and each scheduled purchase-time configuration;
- storefront submission that awaits the permanent order before external navigation and clears only the successfully completed cart or plan;
- a distinct order-recorded state with authoritative total, unpaid/pending states, and a safe retry link using the same handoff;
- explicit recovery when an order persists but handoff formatting unexpectedly fails;
- focused disabled-method, method-confusion, client-price-manipulation, recipient, formatter, encoding, retry, and source-boundary tests.

Cycle 13 adds no database migration or payment record. WhatsApp orders remain `payment_method = 'whatsapp'`, `payment_status = 'unpaid'`, and `fulfilment_status = 'pending'` until later authorized workflows change those independent states.

Deliberately not implemented in Cycle 13:

- Paystack initialization, payment rows, hosted checkout, callbacks, verification, webhooks, or payment-result pages (Cycle 14);
- admin order management or fulfilment transitions (Cycle 15);
- paid-revenue analytics (Cycle 16), feedback/testimonial expansion (Cycle 17), or later deployment work;
- a broad idempotency or public order-lookup subsystem. The UI prevents trivial duplicates and never automatically retries an ambiguous permanent-order request, but response-loss retry ambiguity remains documented.

## Cycle 14 implementation status

Implemented in Cycle 14:

- backend-only Paystack initialization using the existing strict checkout contract and Cycle 12 authoritative repricing engine;
- atomic permanent order plus pending payment-attempt creation with unique provider references;
- Paystack-hosted checkout redirect with a configured storefront callback and no raw card handling;
- raw-body HMAC SHA-512 webhook authentication, validated provider payloads, known-reference lookup, amount/currency integrity checks, and idempotent atomic reconciliation;
- server-to-server verification for known pending attempts, with safe confirming/paid/pending/failed responses;
- a real payment-result page with bounded TanStack Query refresh, trusted order/amount/reference display, and fake-redirect resistance;
- a verified post-payment WhatsApp handoff that does not depend on manual WhatsApp checkout enablement;
- deterministic Node coverage plus pgTAP coverage for privileges, atomic creation, success, duplicates, fulfilment separation, and amount mismatch.

At the Cycle 14 checkpoint, admin order management (Cycle 15) and analytics/revenue UI (Cycle 16) were not implemented. Later content or launch work and refunds remain outside the current scope.

## Cycle 15 implementation status

Implemented in Cycle 15:

- a protected operational Orders area backed by a newest-first, server-filtered, 20-row paginated Supabase RPC;
- combined search across Nuede reference, customer name, phone, and Paystack reference;
- fulfilment, payment-status, payment-method, order-type, and inclusive creation-date filters preserved in the URL;
- responsive desktop table and mobile cards with distinct loading, unavailable, no-order, and no-match states;
- deep-linked order detail containing customer, delivery, purchase totals, historical line/add-on snapshots, nutrition completeness, permanent meal-plan schedule, trusted payment attempts, and persisted timestamps;
- separate payment and fulfilment badges/actions, with provider references and payment states remaining read-only;
- the forward workflow `pending -> confirmed -> preparing -> ready -> out_for_delivery -> delivered`;
- confirmed pre-dispatch cancellation from pending through ready, with a required confirmation and no automatic refund/payment change;
- database-authoritative active-admin authorization, row lock, transition validation, minimal update payload, and existing `admin_audit_log` integration;
- query invalidation, 30-second operational freshness, duplicate-action prevention, success/error feedback, and stale-transition recovery.

Cycle 15 does not re-price orders, query current catalog rows for historical truth, expose private orders publicly, allow manual payment reconciliation, or create refunds. Cycle 16 builds its reporting layer over those accepted records.

## Cycle 16 implementation status

Implemented in Cycle 16:

- a private, canonical one-row-per-order eligible-sale relation requiring an order-level paid state and exact verified Paystack payment evidence;
- PostgreSQL aggregate views for daily, product, variant, add-on, delivery-zone, and payment-method sales;
- one active-admin-only date-range RPC returning a reconciliable summary and all report breakdowns without customer PII;
- Revenue, Paid Orders, Average Order Value, and Items Sold from authoritative integer-kobo and quantity data;
- Africa/Lagos business-date bucketing based on the trusted payment `verified_at` timestamp, with inclusive date inputs and an exclusive following-midnight boundary;
- Today, 7-day, 30-day, 90-day, and validated custom range controls;
- real dashboard KPI cards plus responsive Recharts revenue/order trends, payment mix, zone performance, and semantic ranking tables;
- distinct loading, zero-activity, query-error, and retry states;
- deterministic frontend/source checks and pgTAP reconciliation, boundary, historical snapshot, duplicate-payment, and authorization fixtures.

Only Paystack currently has a trusted paid transition and persisted successful-payment timestamp. WhatsApp orders therefore remain excluded from paid revenue until a separate authorized manual-payment workflow exists; fulfilment progress never implies payment. Product and variant revenue is base-line revenue (`unit_base_price_kobo × quantity`), add-ons are separate (`purchased unit_price_kobo × parent item quantity`), and delivery fees remain visible in the zone breakdown. Their components reconcile to order subtotal/total without reading current catalog prices.
