# Edge Functions

Cycle 12 introduces `create-order`, the public guest-checkout entrypoint for the server-authoritative order engine. Its JavaScript handler delegates request validation, batched catalog loading, business validation, pricing, nutrition, snapshot construction, response formatting, and persistence to focused modules under `_shared/order`.

The function reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only from the Edge runtime. It uses the service role to read hidden/current catalog state and invoke the backend-only `create_order_atomic(jsonb, jsonb)` RPC. Browser applications must never import this code or receive the service-role key.

`create-order` intentionally has gateway JWT verification disabled because V2 checkout is anonymous. The function treats the entire body as hostile, applies a strict Zod contract, and grants no direct order-table or persistence-RPC privilege to public roles.

Cycle 13 adds `create-whatsapp-order`, a narrow JavaScript entrypoint that accepts only `paymentMethod = "whatsapp"`. It delegates permanent creation to the same Cycle 12 engine, so the current checkout setting, catalog, product/variant/add-on relationships, delivery zone, pricing, nutrition, snapshots, statuses, and atomic persistence remain shared authority. Only after that engine returns a permanent reference does the function derive a deterministic message and `wa.me` URL from the authoritative response.

Set `NUEDE_WHATSAPP_NUMBER` in the Edge runtime to the approved business number in international E.164-style form, for example `2348000000000` (digits after an optional leading `+`; no local leading zero). This is backend configuration and must not be supplied by the browser. Missing or invalid configuration returns `WHATSAPP_CONFIGURATION_ERROR` before persistence.

The normal response contains the permanent order plus `{ whatsapp: { message, url } }`. If unexpected handoff formatting fails after persistence, the function keeps the order and returns `WHATSAPP_HANDOFF_FAILED` with a minimal recovery payload containing its reference and statuses. Logs contain error code/stage and, only for that recovery case, the order reference; customer details and message contents are not logged.

Cycle 13 creates no payment row and does not mark WhatsApp revenue as paid. Paystack initialization, verification, payment result states, fulfilment transitions, and analytics remain deferred to later cycles.
