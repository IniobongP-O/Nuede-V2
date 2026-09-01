# Nuede V2

Nuede V2 is a fresh food-commerce and nutrition platform with two independent React applications and one trusted Supabase backend.

The accepted Cycle 0–7 foundation and Cycle 8 nutrition/Saved Meals implementation are present. The storefront reads the live public catalog, derives complete/partial/unavailable nutrition through one shared domain engine, emits validated meal configurations, and keeps product-level saved IDs on the current device. The admin application manages the catalog. Cart, planner UI/state, checkout, order, payment, fulfilment, and analytics workflows remain assigned to later cycles.

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
