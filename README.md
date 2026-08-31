# Nuede V2

Nuede V2 is a fresh food-commerce and nutrition platform with two independent React applications and one trusted Supabase backend.

This repository currently contains the Cycle 0 engineering foundation only. It intentionally contains no commercial product functionality.

## Applications

- `apps/storefront` - customer-facing application
- `apps/admin` - independently deployed administration application

## Getting started

Use Node.js 24 and npm 11.

```sh
npm install
npm run dev:storefront
npm run dev:admin
```

Read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) before making changes. The frozen architecture is documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
