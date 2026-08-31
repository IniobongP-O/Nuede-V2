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
