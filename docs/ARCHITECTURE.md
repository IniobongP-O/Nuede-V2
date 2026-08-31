# Nuede V2 architecture

## Status

This document records the architecture established in Cycle 0. Changes to frozen decisions require explicit approval before implementation.

## Repository model

Nuede V2 uses npm workspaces without a monorepo framework.

```text
apps/storefront  ─┐
                  ├──> packages/*
apps/admin       ─┘

packages/* must not depend on either application.
```

The storefront and admin are independent React/Vite applications. They have separate entry points, development servers, production builds, environment files, deployments, and domains. Sharing a repository does not make them one application.

## Directory responsibilities

- `apps/storefront` contains customer-facing presentation and feature code.
- `apps/admin` contains administrator-facing presentation and feature code.
- `packages/domain` contains framework-independent business calculations and domain rules.
- `packages/validation` contains reusable runtime validation schemas.
- `packages/config` contains public, non-secret shared constants and configuration helpers.
- `supabase/migrations` is the only source of database schema changes.
- `supabase/functions` contains trusted backend operations.
- `docs` contains durable project rules and requirement traceability.

Application-specific UI, hooks, API adapters, and state remain in the application that owns them. Shared packages are introduced only when code has a genuine cross-application or cross-boundary responsibility.

## Feature organization

When feature cycles begin, application code should be organized by feature rather than by a single repository-wide component bucket. A feature may contain its own API adapter, hooks, components, and utilities. Visual components must not scatter direct Supabase calls throughout the tree.

Shared packages must remain independent of React and application routing unless a later approved architectural decision explicitly changes that boundary.

## Authority boundaries

Supabase PostgreSQL is the source of truth for business data. React may display estimates and collect normalized input, but it is never authoritative for prices, totals, order validity, payment state, or fulfilment state.

Trusted server logic must retrieve current database values and decide:

- product, variant, and add-on validity;
- current prices and delivery fees;
- checkout payment-method availability;
- authoritative totals;
- order creation and historical snapshots;
- payment initialization and verification.

Backend code and secrets must never become browser-importable. Payment state and fulfilment state remain separate concepts.

## Frozen technology decisions

- JavaScript and JSX only; no TypeScript.
- React, Vite, and Tailwind CSS v4 for both frontends.
- Supabase PostgreSQL, Auth, Storage, Realtime, and Edge Functions for the backend.
- Paystack hosted checkout for online payments.
- Vercel for two independent frontend deployments.
- Integer kobo for authoritative monetary values.
- Zod plus database constraints for important runtime and persistence boundaries.
- TanStack Query, React Hook Form, Recharts, and Lucide React when their approved cycles need them.
- No V1 migration and no customer accounts at V2 launch.

## Prohibited drift

Do not introduce TypeScript, Firebase, Next.js, Express, another backend/database/payment provider, customer accounts, subscriptions, loyalty, AI recommendations, or a monorepo/state/server framework without explicit approval.

Do not place authoritative pricing in React, expose backend secrets through Vite, permit direct public authoritative order/payment mutation, or build a later cycle early.
