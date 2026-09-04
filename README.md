# Nuede V2

Nuede V2 is a fresh food-commerce and nutrition platform with two independent React applications and one trusted Supabase backend.

The accepted Cycles 0–16 foundation and Cycle 17 content implementation are present. The storefront supports the live catalog, local saved meals/cart/planner, guest checkout, permanent server-authoritative orders, WhatsApp handoff, verified Paystack payments, published testimonials and private guest feedback. The protected admin application manages catalog, delivery/payment settings, order fulfilment, sales reporting, testimonials and the private feedback inbox. See [Cycle 17 implementation and verification](docs/CYCLE17.md) for the content contracts and remaining local database verification. Cycle 18 hardening is underway; production launch is blocked by hosted migration/function gaps and unavailable backend deployment credentials. See [Cycle 18 results](docs/CYCLE18.md) and [deployment runbook](docs/DEPLOYMENT.md).

## Applications

- `apps/storefront` - customer-facing application
- `apps/admin` - independently deployed administration application

Both applications own independent React Router route trees and presentation components. Stable brand tokens are shared through `packages/config`; application UI is not shared across the deployment boundary.

## Getting started

Use Node.js 24 and npm 11.

```sh
npm install
npm run dev:storefront
npm run dev:admin
```

Read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) before making changes. The frozen architecture is documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
