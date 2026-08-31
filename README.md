# Nuede V2

Nuede V2 is a fresh food-commerce and nutrition platform with two independent React applications and one trusted Supabase backend.

This repository contains the Cycle 0 engineering foundation, the Cycle 1 storefront/admin application shells, and the implemented Cycle 2 PostgreSQL database foundation awaiting review and verification. The frontends still use Cycle 1 fixtures and intentionally contain no live database connection, authentication, cart, planner, checkout, payment, order, or analytics behavior.

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
