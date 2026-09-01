# Feature authority and roadmap

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
