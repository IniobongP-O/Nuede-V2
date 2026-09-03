# Edge Functions

Cycle 12 introduces `create-order`, the public guest-checkout entrypoint for the server-authoritative order engine. Its JavaScript handler delegates request validation, batched catalog loading, business validation, pricing, nutrition, snapshot construction, response formatting, and persistence to focused modules under `_shared/order`.

The function reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only from the Edge runtime. It uses the service role to read hidden/current catalog state and invoke the backend-only `create_order_atomic(jsonb, jsonb)` RPC. Browser applications must never import this code or receive the service-role key.

`create-order` intentionally has gateway JWT verification disabled because V2 checkout is anonymous. The function treats the entire body as hostile, applies a strict Zod contract, and grants no direct order-table or persistence-RPC privilege to public roles.

Cycle 12 does not initialize Paystack, create payment rows, generate WhatsApp messages, navigate to WhatsApp, or replace the Cycle 11 mocked storefront submission. Those integrations remain deferred to Cycles 13 and 14.
