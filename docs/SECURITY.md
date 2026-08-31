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

Every Cycle 2 business table has Row Level Security. Hiding an admin URL or frontend control is not authorization.

Public access must eventually be limited to explicitly approved reads and narrowly defined submissions. Public clients must not directly:

- change products or prices;
- read private feedback;
- change admin users;
- insert authoritative orders;
- update payment status or totals;
- change checkout payment settings.

## Authentication and authorization

The admin application uses Supabase email/password authentication. Supabase manages browser session persistence and refresh; Nuede does not store a second token or password copy.

Authentication establishes identity only. Administrative authorization additionally requires the caller's UUID to match an `admin_users` row with `is_active = true` and a recognized `owner`, `admin`, or `editor` role. All three roles have the same Cycle 3 privileges because no finer permission matrix is source-defined.

The caller may select only their own `admin_users` row. Missing and inactive records cannot enumerate administrators or receive active-admin policies. `private.is_active_admin()` is a reviewed, no-argument `SECURITY DEFINER` policy helper with an empty `search_path`; it is outside exposed API schemas and executable only by `authenticated`.

There is no signup UI or signup API in the application. Local Auth configuration disables new signups. Hosted signup is a Supabase Auth project setting and must also be disabled during Cycle 18 provisioning. Administrators are created through trusted local/test or production administrative processes, never by a database trigger on arbitrary Auth users.

## Cycle 3 access matrix

Anonymous and non-admin authenticated clients may read only enabled categories, customer-visible products and variants, available add-ons and compatible relationships, active delivery zones, published testimonials, and the safe checkout payment-options view. Anonymous users may insert feedback but cannot read it.

Active administrators may manage catalog, add-on, delivery, and testimonial records. They may read private feedback, checkout configuration, orders, item snapshots, payments, and audit history. They may not directly mutate admin identities, checkout settings, order/payment state, order snapshots, private feedback, or audit history.

`checkout_payment_options` exposes only `paystack_enabled` and `whatsapp_enabled`. The underlying singleton key, timestamps, and `updated_by` identity remain private.

Service-role access remains backend-only and bypasses RLS. It is used only by future trusted operations and the local-only security test setup. It must never enter a Vite variable or frontend bundle.

RLS is enabled but not forced. This preserves migration ownership and the future service-role Edge Function boundary. PostgreSQL constraints and triggers still apply to trusted callers.

## Trusted administrator bootstrap

Local development uses local Studio or the local Auth Admin API to create a real password-capable Auth identity. A trusted local SQL action then inserts the matching UUID/email/role into `admin_users`. Passwords and service-role keys are not committed or added to `seed.sql`.

Production bootstrap is deferred to Cycle 18. It will create the initial owner through the hosted Auth administration surface and a trusted profile insertion after signup has been disabled.

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

Cycle 3 security code is implemented but is not `Verified` or `Accepted` until the local database tests, direct attack suite, and manual login/session matrix pass.

## Cycle 4 catalog security

Catalog management is rendered only inside the existing protected admin route, but route protection is not the authorization boundary. Category and product queries use the browser anon key plus the authenticated session; the Cycle 3 active-admin RLS policies decide whether hidden/archived rows can be read and whether writes succeed.

The catalog feature adds no service-role credential, custom token persistence, or browser-side RLS bypass. Anonymous and inactive/non-admin clients retain no category/product mutation path. Standard-product mutations are additionally constrained by PostgreSQL rules for product type, integer-kobo price, allowed status, and non-negative nutrition.

Trusted audit records are written only by `private.audit_product_change()` after an RLS-approved product insert or update. Browser roles cannot call the function directly or insert into `admin_audit_log`. Trusted backend/migration operations without an end-user JWT are not assigned a fabricated administrator identity.
