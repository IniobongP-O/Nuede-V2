# Security rules

## Cycle 18 — final hardening, external launch blocked

[Current verification report](CYCLE18.md), [all 212 numbered requirements](FEATURE-MATRIX.md), and [deployment runbook](DEPLOYMENT.md) supersede historical “not begun” statements below. Cycles 0–17 remain accepted. Current hosted schema/function gaps are recorded explicitly and no final launch proof is claimed.

Cycle 18 serializes enabled-method validation with order insertion; restricts payment settings to active owner/admin; replaces client-supplied audit attribution; and records real flag changes in the existing audit log. Request streams are bounded before commerce work. Provider timeout protection covers JSON body reading. Admin caches clear across identity/authorization changes. Public build variables are allowlisted and scanned for backend secret patterns, and deployed configurations include CSP/privacy headers. These controls preserve backend order/payment authority. SQL execution and hosted rollout remain outstanding; consult the attack matrix before treating them as deployed controls.


## Cycle 17 privacy boundary

Public testimonial reads use the four-field, published-only `published_testimonials` security-barrier projection. Anonymous users cannot select the base table; authenticated non-admins cannot read its rows through RLS. Private source links, dates and audit metadata never cross the public projection. Feedback accepts anonymous INSERT only on `customer_name,email,subject,rating,message`, with meaningful database constraints and no returning read. Public feedback SELECT/UPDATE/DELETE remain unavailable, and feedback is excluded from Realtime publication.

Existing active owner/admin/editor content permissions are retained. Conversion copies editable public fields to an unpublished distinct testimonial; the source remains private and intact. A database trigger rejects published creation, while a separate update explicitly publishes. Admin writes are audited by the database, and browser audit writes remain denied. New frontend text is rendered without unsafe HTML. No service-role secrets or commerce/payment authority were introduced.

These controls have code/contract and mocked-browser coverage; actual role/grant/trigger execution remains NOT RUN without local Supabase. Existing validation and payload limits are present; no CAPTCHA or rate-limiting infrastructure existed to integrate. See [Cycle 17 verification and limitations](CYCLE17.md), including the added database test matrix. Cycle 18 production security work was not started.

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

## Cycle 5 catalog and Storage security

The `product-images` bucket is public only for image reads. Insert, update, and delete policies require `authenticated`, `private.is_active_admin()`, the correct bucket, and a UUID-owned product/variant object path. Anonymous and ordinary authenticated customers receive no image-write policy. No service-role credential is used by the admin application.

Existing catalog RLS continues to authorize grouped-parent, variant, add-on, and assignment writes. Database triggers additionally reject impossible orderable groups, invalid or cross-group defaults, moving stable variants between groups, and invalidating the final orderable/default variant. Atomic reorder and assignment functions explicitly recheck active-admin authorization and validate exact relationship sets.

Image replacement follows upload -> database reference -> old-object cleanup. A database failure removes the newly uploaded object, while a successful reference update occurs before any old object is removed. Supported type, five-megabyte size, image decoding, and optimization checks run before upload; bucket restrictions provide an independent persistence boundary.

## Cycle 12 order-creation boundary

`create-order` is intentionally invokable without a customer account, but it is not a public database-write grant. The Edge Function owns the backend-only service-role client, strictly parses the Cycle 11 selection contract, and rejects unexpected price, total, availability, and nutrition fields. It reloads every selected row and relationship plus the delivery zone and payment settings before calculating the order.

Only `service_role` can execute `create_order_atomic(jsonb, jsonb)`. `anon` and `authenticated` retain no direct insert permission on `orders`, `order_items`, `order_item_addons`, or `payments`, and cannot execute the RPC. The `SECURITY DEFINER` function has an empty `search_path`, hard-codes safe initial `unpaid`/`pending` statuses, generates the reference from a private sequence, and inserts the full snapshot graph within one PostgreSQL transaction.

Failures log only an error code and validation stage. Customer PII, request bodies, database errors, stack traces, and secrets are not returned or deliberately logged. The broad public function entrypoint means abuse/rate limiting remains a deployment-hardening concern; it does not weaken database authorization.

## Cycle 14 Paystack boundary

- `PAYSTACK_SECRET_KEY` exists only in Edge Function runtime configuration and authenticates both Paystack API calls and webhook HMAC SHA-512 signatures. There is no `VITE_PAYSTACK_SECRET_KEY` or separate client secret.
- The browser sends only the strict selection contract. Current catalog rows, relationships, availability, checkout enablement, delivery fee, nutrition, and integer-kobo totals are recalculated by the Cycle 12 engine.
- Paystack initialization is allowed only after current Paystack enablement passes and the permanent order/pending attempt commit atomically. Disabling Paystack later does not block reconciliation of a previously valid attempt.
- Redirect query parameters never transition payment state. The verification function first looks up a known internal reference, then uses the backend secret to query Paystack.
- The webhook signs the untouched raw body and rejects an invalid signature before JSON parsing or database access. Valid relevant events are matched by the stored unique provider reference, not trusted metadata.
- Amount and NGN currency must equal the stored attempt. Mismatches become a verified integrity failure and cannot enter paid revenue. Row locks, unique provider identities, and terminal-paid no-op behavior protect duplicate delivery.
- Payment/order payment status changes occur in one RPC transaction. No Cycle 14 function changes fulfilment status or broadens public table/RPC access.

## Cycle 15 admin order boundary

Anonymous callers have no execution privilege on either admin-orders RPC. Authenticated callers can reach the RPC entrypoints, but both independently require a current active `owner`, `admin`, or `editor` record, matching the existing undifferentiated role model. Direct authenticated `UPDATE` remains denied on both `orders` and `payments`.

The fulfilment RPC locks and validates current state in PostgreSQL, obtains its audit actor from `auth.uid()`, and updates only `fulfilment_status`. A crafted browser request cannot skip workflow steps, reverse terminal states, forge the acting administrator, or overwrite payment state, provider references, totals, and purchase snapshots. Cancelling a paid order does not claim or initiate a refund.

## Cycle 16 analytics boundary

Analytics is read-only and private. Anonymous callers have no execute privilege on `get_admin_sales_analytics(date,date)`. Authenticated callers can reach the function only so it can perform the same current active-admin check used elsewhere; inactive, missing, and unrecognized identities receive `ADMIN_ACCESS_REQUIRED`. Private aggregate views have no browser grants, and the security-definer RPC pins an empty search path.

The browser receives one aggregated payload with stable catalog/delivery IDs where retained, historical labels, counts, and integer-kobo totals. It receives no customer names, phones, emails, addresses, order references, provider references, transaction IDs, or raw payment history. No analytics component performs inserts, updates, deletes, payment verification, fulfilment changes, or source-data correction. The Vite bundle contains no service-role or Paystack secret.

Eligibility requires trusted Cycle 14 Paystack evidence rather than an order creation, redirect, fulfilment state, or payment-method label. Multiple qualifying payment records are reduced to the earliest verification timestamp at order grain. The canonical relation excludes refunded state and cannot turn a cancellation into a refund. Because no trusted manual-paid workflow exists yet, WhatsApp orders remain excluded even if they have progressed operationally.
