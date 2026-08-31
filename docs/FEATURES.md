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
