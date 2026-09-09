# Deployment and launch runbook

This runbook describes the required configuration. It is not evidence of deployment.
See [Cycle 18 results](CYCLE18.md) for actual execution status. Never seed a production
database with `supabase/seed.sql`; it contains development meals, prices and stories.

## Deployment identity

Use the `IniobongP-O/Nuede-V2` repository. The existing Vercel `nuede-2` project is
linked to the different `Nuede-2` repository and must not be mistaken for a V2 deployment.
The two local app environments currently name `akerwoivvdcrdelguwdb.supabase.co`.
Confirm its production designation before applying hosted changes. Production domains,
owner identity and approved business content remain required operator inputs.

## Reproducible local verification

Use Node 24 and npm 11. Install from the repository root with `npm ci`.

```sh
npm run lint
npm test
npm run build:storefront
npm run build:admin
npm run test:secrets
npm run test:browser:cycle18
```

The browser suite defaults to installed Microsoft Edge. Set `NUEDE_BROWSER_CHANNEL=chrome`
to check installed Chrome. Supabase, Paystack and WhatsApp are mocked in that suite.
The existing `node scripts/verify-cycle17-browser.mjs` covers content mutation and privacy UI.

With a local Docker/Podman runtime:

```sh
npm run supabase:start
npm run db:reset
npm run db:test
npm run test:security:cycle3
npm run test:catalog:cycle4
npm run test:catalog:cycle5
```

These test utilities target local Supabase only. Never point their fixture writes or
reset command at production. Run the entire SQL suite, including Cycle 18's new test.

## Production Supabase migrations

1. Authenticate through `npx supabase login` or the secret `SUPABASE_ACCESS_TOKEN`.
2. Record the intended project reference and a recoverable database backup/PITR point.
3. Link with `npx supabase link --project-ref <intended-project-ref>`.
4. Run `npx supabase migration list --linked` and `npx supabase db push --dry-run`.
5. Apply `npx supabase db push` without `--include-seed`. Never run a linked reset.
6. Run `npx supabase migration list --linked` again and the read-only
   `supabase/verification/launch-readiness.sql` using a privileged SQL session.
7. Confirm the complete 15-migration chain through `20260904000400`.

The Cycle 18 hardening migration serializes new-order creation with payment-setting changes and
restricts settings writes to active owner/admin roles. The analytics migration completes order-activity
and cart/meal-plan reporting; the final migration changes public views to invoker security with
narrow guest grants/RLS (see `PUBLIC-VIEW-SECURITY.md`). Hardening does not block reconciliation
of existing Paystack attempts after a method is disabled. Missing hosted tables/RPCs
must be fixed by applying their original migrations, not recreating them manually.

## Owner, Auth, Storage and business setup

- Disable public email signup in hosted Auth. Local `config.toml` is not proof that the
  hosted Auth setting matches. No customer account flow is required.
- Create the intended owner securely in Supabase Auth. Insert its matching UUID, lowercase
  email, `role='owner'` and `is_active=true` in `admin_users` through the trusted setup process.
  Do not store the password in Git, frontend env files or this runbook.
- Set Auth Site URL to the intended admin origin and allow the actual admin redirect URLs.
  Restrict preview URLs to explicitly required environments. Verify login, refresh,
  logout, expired session, inactive owner, non-admin and editor access.
- Verify the migration-created `product-images` bucket, MIME/size restrictions and
  authenticated write policies. Test upload, replacement, invalid/oversized files,
  public image reads and broken-image fallback through the apps.
- Enter approved categories, meals, variants, add-ons, prices in integer kobo, nutrition,
  images and active delivery zones. Check all sold-out/hidden/archived/price-pending states.
- Set at least one checkout method enabled. Enable a method only after its backend
  configuration is functional. Owner/admin may change settings; editor is read-only.
- Set approved contact details and publish only approved testimonials. Do not invent
  business phone numbers, social accounts, hours, images or historical sales.

## Environment variables

| Boundary | Variables | Rules |
|---|---|---|
| Both Vercel apps | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Same intended Supabase backend; public/publishable key only |
| Storefront SEO | `VITE_PUBLIC_SITE_URL` | Required approved HTTPS production origin; localhost, example and Vercel preview origins fail production builds |
| Storefront optional SEO | `VITE_GOOGLE_SITE_VERIFICATION` | Real Search Console token when issued; empty is valid |
| Storefront optional contact | `VITE_CONTACT_PHONE`, `VITE_CONTACT_WHATSAPP`, `VITE_CONTACT_EMAIL`, `VITE_CONTACT_INSTAGRAM`, `VITE_CONTACT_HOURS` | Approved public business values; empty values render no fake link |
| Edge runtime | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase-provided backend credentials; never Vite/Vercel frontend values |
| Edge custom secrets | `PAYSTACK_SECRET_KEY`, `NUEDE_STOREFRONT_URL`, `NUEDE_WHATSAPP_NUMBER` | Backend only; storefront URL is the final origin with trailing slash |
| Operator tooling | `SUPABASE_ACCESS_TOKEN`, database password, Vercel CLI authentication | Secure session/secret store only |

The Vite build guard rejects arbitrary `VITE_` names while permitting Nuede's explicit
allowlist and Vercel-generated public metadata under `VITE_VERCEL_*`. Every permitted value,
including Vercel metadata, is still rejected if it matches a backend secret pattern. Production
Vercel builds reject missing/placeholder configuration. Keep preview and production
environment values separate. Do not pass backend keys through Vite to solve access errors.

## Edge Functions and Paystack

Use Paystack test mode for acceptance unless a live transaction is explicitly authorized.
Nuede uses hosted checkout and requires no Paystack frontend key. Keep one consistent
Paystack account/mode across initialization, verification and webhook configuration.

Set custom secrets securely in Supabase or use
`npx supabase secrets set --env-file <secure-backend-env-file>` without printing its contents.
Hosted Supabase supplies its own `SUPABASE_*` runtime values. Deploy every repository function:

```sh
npx supabase functions deploy create-order --project-ref <intended-project-ref>
npx supabase functions deploy create-whatsapp-order --project-ref <intended-project-ref>
npx supabase functions deploy initialize-paystack --project-ref <intended-project-ref>
npx supabase functions deploy verify-paystack-payment --project-ref <intended-project-ref>
npx supabase functions deploy paystack-webhook --project-ref <intended-project-ref>
```

Use the JavaScript entrypoints and JWT settings in `supabase/config.toml`. Guest commerce
endpoints validate untrusted input; webhook authentication is HMAC SHA-512 over the raw
body. Do not place a login-only gateway in front of the provider webhook.

Set Paystack webhook to `https://<project-ref>.supabase.co/functions/v1/paystack-webhook`.
The callback derives from `NUEDE_STOREFRONT_URL` and must resolve to the storefront `/payment`.
Check the actual provider delivery log: valid delivery, invalid signature, unknown reference,
wrong amount/currency, duplicate and concurrent delivery. Inspect database evidence after
each case; a 200 response alone is insufficient. Keep failed/unknown attempts out of revenue.

## Two Vercel projects

Create two independent projects from `Nuede-V2` with the following settings:

| Setting | Storefront | Admin |
|---|---|---|
| Root directory | `apps/storefront` | `apps/admin` |
| Framework | Vite | Vite |
| Node version | 24.x | 24.x |
| Install | `cd ../.. && npm ci` | `cd ../.. && npm ci` |
| Build | `npm run build` | `npm run build` |
| Output | `dist` | `dist` |
| Outside-root source access | Enabled | Enabled |
| Domain | Intended storefront domain | Intended admin domain |

The application-root `vercel.json` files supply SPA rewrites and security headers. Configure
root directories in Project Settings, not as an unsupported `rootDirectory` vercel.json key.
The CSP permits the standard `*.supabase.co` endpoints; explicitly adjust the host allowlist
if an approved custom Supabase domain is used. Verify response headers and all asset loads
on deployed URLs. Check both apps independently; linking one CLI directory must not deploy
the other app by accident. Record project IDs, deployment IDs, Git SHA and domains.

Directly open and refresh storefront `/`, `/menu`, `/saved`, `/planner`, `/checkout` and
`/payment`. Check admin `/login`, `/dashboard`, `/menu`, `/orders`, an order detail URL,
`/analytics`, `/delivery`, `/testimonials`, `/feedback`, `/settings`. Logged-out admin
routes must reach login; backend authorization must still deny direct private requests.

## Final launch proof and evidence

Run all five customer paths against the deployed applications and intended backend:
standard/WhatsApp, standard/Paystack, grouped+variant+multiple-add-ons/Paystack,
meal-plan/WhatsApp, meal-plan/Paystack. Use a clearly identified acceptance order and
record evidence securely without customer PII or keys.

For the final Paystack order, record each handoff with PASS/FAIL/NOT RUN:

1. Product from intended Supabase; correct price, variant, add-ons and availability.
2. Cart configuration survives refresh; checkout reloads delivery and enabled methods.
3. Edge validates IDs and reprices; permanent order/items/add-ons and payment attempt exist.
4. Hosted checkout completes in the documented mode; no card data reaches Nuede.
5. Trusted verification matches reference, integer amount and NGN; paid once after replay.
6. Admin displays the same reference and immutable purchased snapshots/schedule.
7. Compare analytics against eligible distinct paid orders, purchased quantities and prices.
8. Progress Pending → Confirmed → Preparing → Ready → Out for delivery → Delivered.
9. Final order is paid and delivered; pending/failed/WhatsApp-unpaid orders contribute no revenue.

Do not insert a paid order directly as a substitute. Do not count mocked browser payments
as this proof. If access prevents execution, record **FINAL LAUNCH PROOF NOT RUN**.

## Rollback and recovery

Keep the previous application deployment IDs and database backup/PITR point before changes.
Promote only the reproducible revision whose tests and deployed smoke checks passed.
Roll back an app to its recorded deployment if necessary, while retaining security migrations
and payment webhook handling. Disabling new Paystack checkout must leave verification of
existing attempts operating. Do not reset production, delete accepted orders or remove
payment uniqueness constraints. Prefer forward corrective migrations; coordinate any database
restore with provider reconciliation so payments received after the restore point are recovered.

The final checkpoint `chore: harden and launch Nuede V2` is reserved for an actually verified
known-good launch. Do not use it for a deployment-preparation state with outstanding proof.

Configuration references: [Vercel Vite routing](https://vercel.com/docs/frameworks/frontend/vite),
[Vercel monorepo source access](https://vercel.com/docs/monorepos/monorepo-faq),
[Supabase function deployment](https://supabase.com/docs/guides/functions/deploy),
[Paystack webhooks](https://paystack.com/docs/payments/webhooks/),
[Paystack verification](https://paystack.com/docs/payments/verify-payments/).
