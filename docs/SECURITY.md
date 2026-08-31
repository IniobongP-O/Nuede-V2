# Security rules

## Trust model

The browser is an untrusted client. It may display estimates and send normalized selections, but it cannot decide authoritative prices, totals, order validity, payment status, fulfilment status, or enabled checkout methods.

Supabase Edge Functions and protected database operations form the trusted execution boundary for commerce behavior.

## Environment variables and secrets

Only browser-safe values may use Vite's `VITE_` prefix. A Supabase project URL and public/anon key may be exposed when an approved cycle connects an application.

The following are always backend-only:

- Supabase service-role credentials;
- Paystack secret keys;
- webhook secrets;
- private server credentials.

Real `.env` files are ignored. Committed `.env.example` files contain placeholders only. Shared configuration packages must never contain secrets.

## Database access

Row Level Security is required before admin CRUD is introduced. Hiding an admin URL or frontend control is not authorization.

Public access must eventually be limited to explicitly approved reads and narrowly defined submissions. Public clients must not directly:

- change products or prices;
- read private feedback;
- change admin users;
- insert authoritative orders;
- update payment status or totals;
- change checkout payment settings.

## Cycle 2 pre-RLS warning

Cycle 2 creates the relational schema but intentionally does not enable Row Level Security or define public/admin policies. The database foundation is not production-secure until Cycle 3 implements and verifies RLS and trusted admin authorization.

Until then:

- use only the disposable local Supabase stack;
- do not push the Cycle 2-only schema to production;
- do not connect either frontend to these tables;
- do not interpret absent frontend controls as authorization;
- do not grant direct public order, payment, admin, audit, or settings mutation.

The checkout singleton prevents an invalid all-disabled state at the database layer. Role authorization, authorized mutation, and audit writes remain later trusted operations.

## Orders and payments

- Trusted backend logic revalidates products, variants, add-ons, delivery fees, and payment settings.
- Orders are persisted before fulfilment or a WhatsApp conversation begins.
- Paystack initialization occurs with a backend secret.
- Redirect parameters never prove payment success.
- Webhook signatures must be verified.
- Webhook and verification updates must be idempotent.
- Payment and fulfilment statuses remain independent.

## Review expectations

Every cycle must review new trust boundaries, data exposure, validation, authorization, secret handling, and failure states. Security checks must not be weakened or suppressed to obtain passing output.

Cycle 0 implements conventions only; it does not claim that future database or commerce security is already implemented.
