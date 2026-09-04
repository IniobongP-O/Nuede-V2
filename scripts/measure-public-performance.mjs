// Read-only, public projections only. Logs sizes/timings, never keys or row values.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { normalizeMenuProduct } from "../apps/storefront/src/features/menu/utils/menuModel.js";
const env = parseEnv(await readFile("apps/storefront/.env", "utf8"));
const source = await readFile("apps/storefront/src/features/menu/api/menuApi.js", "utf8");
const fieldSource = source.match(/const menuProductFields = \[([\s\S]*?)\]\.join/)[1];
const fields = [...fieldSource.matchAll(/"([^"]+)"/g)].map((match) => match[1]).join(",");
const queries = { products: `${fields}&status=in.(available,sold_out,price_pending,unavailable)&order=sort_order.asc,name.asc`, categories: "id,name,slug,sort_order&is_enabled=eq.true", delivery_zones: "id,name,fee_kobo,sort_order&is_active=eq.true", checkout_payment_options: "paystack_enabled,whatsapp_enabled" };
const results = []; let rows = [];
for (const [table, select] of Object.entries(queries)) {
  for (let run = 0; run < 3; run++) {
    const start = performance.now();
    const response = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=${select}`, { headers: { apikey: env.VITE_SUPABASE_ANON_KEY }, signal: AbortSignal.timeout(15000) });
    const body = await response.text();
    const result = { table, run, status: response.status, elapsedMs: performance.now() - start, bodyBytes: Buffer.byteLength(body) };
    if (table === "products" && response.ok) { rows = JSON.parse(body); const start = performance.now(); rows.map((row) => normalizeMenuProduct(row, (image) => image)); result.normalizationMs = performance.now() - start; result.rows = rows.length; }
    results.push(result);
  }
}
const paths = [...new Set(rows.flatMap((row) => [row.image_path, ...row.product_variants.map((v) => v.image_path)]).filter(Boolean))];
for (const imagePath of paths.slice(0, 5)) {
  const start = performance.now(); const response = await fetch(`${env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath}`, { signal: AbortSignal.timeout(15000) });
  const bytes = (await response.arrayBuffer()).byteLength;
  results.push({ table: "public image", status: response.status, bytes, elapsedMs: performance.now() - start, cacheControl: response.headers.get("cache-control"), contentType: response.headers.get("content-type") });
}
await mkdir("coverage/performance", { recursive: true });
await writeFile("coverage/performance/public-read.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
