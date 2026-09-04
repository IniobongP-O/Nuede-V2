// Non-destructive audit of the backend already configured for the storefront.
// No real record is targeted by write probes; no data values/keys are logged.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
const env = parseEnv(await readFile("apps/storefront/.env", "utf8"));
const base = new URL(env.VITE_SUPABASE_URL);
const headers = { apikey: env.VITE_SUPABASE_ANON_KEY, "Content-Type": "application/json" };
const results = [];
async function probe(name, path, { method = "GET", body, expected, inspect } = {}) {
  const response = await fetch(new URL(path, base), { method, headers, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000) });
  let payload; try { payload = await response.json(); } catch { payload = null; }
  const result = { name, status: response.status, result: expected(response, payload) ? "PASS" : "FAIL", ...(inspect ? inspect(payload) : {}) };
  results.push(result); console.log(JSON.stringify(result));
}
await mkdir("coverage/cycle18", { recursive: true });
try {
  for (const table of ["categories", "products", "delivery_zones", "checkout_payment_options", "published_testimonials"]) {
    await probe(`public read ${table}`, `/rest/v1/${table}?select=*&limit=1`, { expected: (r) => r.ok });
  }
  for (const table of ["admin_users", "orders", "order_items", "order_item_addons", "payments", "feedback", "testimonials", "admin_audit_log"]) {
    await probe(`private read ${table}`, `/rest/v1/${table}?select=*&limit=1`, { expected: (r) => [401, 403].includes(r.status) });
  }
  const nonexistent = "00000000-0000-0000-0000-000000000000";
  for (const [table, body] of [["products", { price_kobo: 1 }], ["product_variants", { price_kobo: 1 }], ["product_addons", { price_kobo: 1 }], ["delivery_zones", { fee_kobo: 1 }], ["orders", { payment_status: "paid", total_kobo: 1 }], ["order_items", { product_name: "forged" }], ["testimonials", { is_published: true }], ["feedback", { message: "forged" }]]) {
    await probe(`anonymous update ${table} (nonexistent ID)`, `/rest/v1/${table}?id=eq.${nonexistent}`, { method: "PATCH", body, expected: (r) => [401, 403].includes(r.status) });
  }
  for (const [name, body] of [
    ["get_admin_sales_analytics", { p_from: "2026-09-01", p_to: "2026-09-04" }],
    ["list_admin_orders", { p_search: null, p_fulfilment_status: null, p_payment_status: null, p_payment_method: null, p_order_type: null, p_created_from: null, p_created_to: null, p_page: 1, p_page_size: 5 }],
  ]) await probe(`anonymous RPC ${name}`, `/rest/v1/rpc/${name}`, { method: "POST", body, expected: (r, p) => [401, 403].includes(r.status) && p?.code === "42501", inspect: (p) => ({ errorCode: p?.code || null }) });
  await probe("invalid webhook signature", "/functions/v1/paystack-webhook", { method: "POST", body: { event: "charge.success", data: {} }, expected: (r, p) => r.status === 401 && p?.error?.code === "INVALID_WEBHOOK_SIGNATURE" });
  await probe("unknown payment reference", "/functions/v1/verify-paystack-payment", { method: "POST", body: { reference: "NUE-cycle18-nonexistent-audit-reference" }, expected: (r, p) => r.status === 404 && p?.error?.code === "PAYMENT_NOT_FOUND" });
} finally {
  await writeFile("coverage/cycle18/hosted-public-audit.json", JSON.stringify({ target: base.origin, note: "Existing app backend; production designation unconfirmed. No record values logged. Nonexistent-ID write probes verify grants, not real-row RLS behavior.", results }, null, 2));
}
if (results.some((r) => r.result === "FAIL")) process.exitCode = 1;
