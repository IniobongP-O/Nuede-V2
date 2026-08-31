# Database rules

## Source of truth

Nuede V2 uses Supabase PostgreSQL as the source of truth for business data. Browser storage is permitted only for explicitly local customer conveniences such as future favorites, carts, and meal plans; it is not a trusted commerce database.

Cycle 0 creates no commercial tables, functions, policies, or seed records.

## Schema changes

Every schema change must be represented by an ordered file in `supabase/migrations`. Undocumented dashboard-only schema changes are prohibited. A fresh environment must eventually be reproducible from migrations plus `supabase/seed.sql`.

## Money

Authoritative monetary values are stored as integer kobo. Floating-point values must not be the source of truth for prices, fees, totals, or payment amounts.

Example: NGN 6,500 is stored as `650000` kobo.

## Identifiers and history

- Business entities use stable database identifiers.
- Product and variant identifiers must remain reliable across carts, plans, orders, and analytics.
- Historical order rows snapshot the names, prices, nutrition, add-ons, and quantities that applied at purchase time.
- Menu edits must not rewrite historical orders.

## Naming and data conventions

- PostgreSQL identifiers use descriptive `snake_case` names.
- JavaScript values use `camelCase` at application boundaries.
- Timestamps are stored with timezone awareness and treated as UTC in persistence.
- Required invariants belong in database constraints as well as appropriate runtime validation.
- Archive/visibility/status fields are preferred over destructive deletion when history or relationships matter.

The commercial schema and its exact constraints begin in Cycle 2 and must not be inferred from this foundation document alone.
