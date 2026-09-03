# Nuede V2

Nuede V2 is a fresh food-commerce and nutrition platform with two independent React applications and one trusted Supabase backend.

The accepted Cycle 0–15 foundation and Cycle 16 first-party sales analytics implementation are present. The storefront supports the live catalog, local saved meals/cart/planner, guest checkout, permanent server-authoritative orders, WhatsApp handoff, and verified Paystack payments. The protected admin application manages catalog, delivery/payment settings, operational order fulfilment, and reconciliable sales reporting. Later-cycle content and deployment work remain outside this checkpoint.

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
