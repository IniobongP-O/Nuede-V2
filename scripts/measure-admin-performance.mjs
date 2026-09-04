// Uses the instrumented production builds from verify-performance.mjs and Cycle 18 fixtures.
/* global window, document, requestAnimationFrame */
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { preview } from "vite";
const phase = process.argv[2] || "after";
assert.match(phase, /^[a-z0-9-]+$/);
const output = path.resolve(`coverage/performance/${phase}`);
import { id, category, meal, addons, variant, grouped, user, token, settings, zone } from "./cycle18-browser-fixtures.mjs";
const group = { ...grouped, product_variants: Array.from({ length: 20 }, (_, i) => ({ ...variant, id: id(100 + i), name: `Option ${i + 1}` })) };
const products = [group, ...Array.from({ length: 119 }, (_, i) => ({ ...meal, id: id(500 + i), name: `Prepared ${i}` }))];
const report = [];
const server = await preview({ root: path.resolve("apps/admin"), build: { outDir: path.resolve(`coverage/performance/${process.env.NUEDE_PERF_REUSE || phase}/admin`) }, preview: { host: "127.0.0.1", port: 5476, strictPort: true }, logLevel: "error" });
const browser = await chromium.launch({ headless: true, channel: process.env.NUEDE_BROWSER_CHANNEL || "msedge" });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    let requests = 0;
    await context.route("http://127.0.0.1:54321/**", async (route) => {
      requests++;
      const table = new URL(route.request().url()).pathname.split("/").at(-1);
      const values = { token: { access_token: token, refresh_token: "qa-refresh", token_type: "bearer", expires_in: 3600, user }, user, admin_users: { ...user, role: "admin", is_active: true }, products, categories: [category], product_addons: addons, delivery_zones: [zone], checkout_settings: settings, testimonials: [], feedback: [], list_admin_orders: [], get_admin_sales_analytics: { summary: { revenue_kobo: "0", paid_orders: 0, average_order_value_kobo: "0", items_sold: 0 }, order_activity: { total_orders: 0, cancelled_orders: 0, failed_payments: 0 }, daily_sales: [], product_sales: [], variant_sales: [], addon_sales: [], delivery_zone_sales: [], payment_method_sales: [], order_type_sales: [] } };
      assert.ok(table in values, table); await route.fulfill({ contentType: "application/json", body: JSON.stringify(values[table]), headers: { "content-range": "0-0/0" } });
    });
    const page = await context.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    const cdp = await context.newCDPSession(page); await cdp.send("Performance.enable"); await cdp.send("Emulation.setCPUThrottlingRate", { rate: width === 390 ? 4 : 1 });
    await page.goto("http://127.0.0.1:5476/menu"); await page.getByLabel("Email address", { exact: false }).fill(user.email); await page.getByLabel("Password", { exact: false }).fill("QA-browser-only-123!"); await page.getByRole("button", { name: "Sign in", exact: true }).click(); await page.getByRole("button", { name: "Add grouped meal", exact: true }).waitFor(); await page.waitForLoadState("networkidle");
    for (const mode of (process.env.NUEDE_PERF_MODES || "original,no-backdrop").split(",")) {
      const style = await page.addStyleTag({ content: mode === "no-backdrop" ? "dialog::backdrop {backdrop-filter:none!important}" : "/* original */" });
      const runs = [];
      for (let i = 0; i < 5; i++) {
        const trigger = page.getByRole("button", { name: "Manage", exact: true }).filter({ visible: true }).first();
        await trigger.scrollIntoViewIfNeeded(); await page.evaluate(() => { window.__renders = {}; }); const count = requests;
        await trigger.evaluate((el) => el.addEventListener("click", () => { window.__clickAt = performance.now(); }, { once: true }));
        await trigger.click(); await page.locator("dialog[open]").waitFor();
        const openMs = await page.evaluate(async () => { await new Promise(requestAnimationFrame); return performance.now() - window.__clickAt; });
        const renderCount = await page.evaluate(() => window.__renders.ProductList || 0);
        const before = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
        const frames = await page.evaluate(async () => { const dialog = document.querySelector("dialog[open]"); const times = []; let previous = performance.now(); for (let i = 0; i < 90; i++) { await new Promise(requestAnimationFrame); const now = performance.now(); times.push(now - previous); previous = now; dialog.scrollTop += i < 45 ? 24 : -24; } return times; });
        const after = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
        await page.keyboard.press("Escape");
        runs.push({ openMs, listRenders: renderCount, requests: requests - count, scrollTaskMs: (after.TaskDuration - before.TaskDuration) * 1000, p95FrameMs: frames.sort((a, b) => a - b)[85] });
      }
      const summary = Object.fromEntries(Object.keys(runs[0]).map((key) => [key, runs.map((r) => r[key]).sort((a, b) => a - b)[2]]));
      report.push({ width, mode, summary, runs }); console.log(width, mode, summary); await style.evaluate((el) => el.remove());
      if (phase.startsWith("after")) assert.equal(summary.listRenders, 0);
    }
    for (const route of ["dashboard", "orders", "analytics", "delivery", "testimonials", "feedback", "settings"]) {
      const count = requests; const start = performance.now(); await page.goto(`http://127.0.0.1:5476/${route}`); await page.waitForLoadState("networkidle");
      report.push({ width, route, settleMs: performance.now() - start, requests: requests - count });
    }
    assert.deepEqual(errors, []); await context.close();
  }
} finally { await writeFile(path.join(output, "admin-report.json"), JSON.stringify(report, null, 2)); await browser.close(); await new Promise((resolve) => server.httpServer.close(resolve)); }
