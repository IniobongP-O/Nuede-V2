// Extends Cycle 18's Playwright/Vite fixture approach. No hosted writes or analytics.
/* global window, document, requestAnimationFrame */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { chromium } from "playwright";
import { build, preview } from "vite";
import { normalizeMenuProduct } from "../apps/storefront/src/features/menu/utils/menuModel.js";

const phase = process.argv[2] || "after";
assert.match(phase, /^[a-z0-9-]+$/);
const output = path.resolve(`coverage/performance/${phase}`);
await mkdir(output, { recursive: true });
process.env.VITE_SUPABASE_URL = "http://127.0.0.1:54321";
process.env.VITE_SUPABASE_ANON_KEY = "cycle18-browser-public-fixture";
import { id, category, meal, addons, variant, grouped, zone, settings } from "./cycle18-browser-fixtures.mjs";
const variants = Array.from({ length: 12 }, (_, i) => ({ ...variant, id: id(100 + i), name: `Meal option ${i + 1}`, sort_order: i }));
const extras = Array.from({ length: 8 }, (_, i) => ({ ...addons[0], id: id(200 + i), name: `Extra ${i + 1}` }));
const group = { ...grouped, product_variants: variants, product_addon_assignments: extras.map((addon) => ({ addon_id: addon.id, addon, sort_order: 1 })) };
const products = [group, ...Array.from({ length: 119 }, (_, i) => ({ ...meal, id: id(500 + i), name: `Prepared meal ${i + 1}`, slug: `meal-${i + 1}` }))];
const payloadBytes = Buffer.byteLength(JSON.stringify(products));
const normalization = [];
for (let i = 0; i < 21; i++) { const start = performance.now(); products.map((row) => normalizeMenuProduct(row, () => "")); if (i) normalization.push(performance.now() - start); }
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const round = (value) => Math.round(value * 100) / 100;
const report = { phase, scope: "Instrumented production React builds; synthetic 120-product catalog, 12 variants, 8 add-ons. Mocked HTTP; no database/provider timing claim.", payloadBytes, normalizationMedianMs: median(normalization), bundles: {}, scenarios: [] };
const servers = [];
let browser;

function instrumentation() {
  return { name: "local-performance-counters", enforce: "pre", transform(code, file) {
    if (!file.includes("/src/")) return;
    for (const name of ["MenuProductCard", "ProductList", "ProductDetailDialog"]) {
      code = code.replace(new RegExp(`(function ${name}\\([^\\n]+\\) \\{)`), `$1 globalThis.__renders ||= {}; globalThis.__renders.${name} = (globalThis.__renders.${name} || 0) + 1;`);
    }
    if (file.endsWith("/useMenuRealtime.js")) code = code.replace("const channel =", "globalThis.__catalogSignals = { products: invalidateProducts, categories: invalidateCategories }; const channel =");
    return code;
  } };
}
async function start(app, port) {
  const outDir = process.env.NUEDE_PERF_REUSE ? path.resolve(`coverage/performance/${process.env.NUEDE_PERF_REUSE}/${app}`) : path.join(output, app);
  if (!process.env.NUEDE_PERF_REUSE) await build({ root: path.resolve(`apps/${app}`), plugins: [instrumentation()], build: { outDir, emptyOutDir: true }, logLevel: "error" });
  report.bundles[app] = [];
  if (process.env.NUEDE_PERF_REUSE) report.bundles[app] = JSON.parse(await readFile(`coverage/performance/${process.env.NUEDE_PERF_REUSE}/report.json`, "utf8")).bundles[app];
  for (const file of process.env.NUEDE_PERF_REUSE ? [] : await readdir(`apps/${app}/dist/assets`)) {
    if (!/\.(js|css)$/.test(file)) continue;
    const bytes = await readFile(`apps/${app}/dist/assets/${file}`);
    report.bundles[app].push({ file, bytes: bytes.length, gzip: gzipSync(bytes).length });
  }
  const server = await preview({ root: path.resolve(`apps/${app}`), build: { outDir }, preview: { host: "127.0.0.1", port, strictPort: true }, logLevel: "error" });
  servers.push(server); return `http://127.0.0.1:${port}`;
}
async function metrics(cdp) { return Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value])); }
async function scroll(page, selector) {
  return page.evaluate(async (selector) => {
    const target = document.querySelector(selector); const times = []; let previous = performance.now();
    for (let frame = 0; frame < 90; frame++) {
      await new Promise(requestAnimationFrame); const now = performance.now(); times.push(now - previous); previous = now;
      target.scrollTop += frame < 45 ? 28 : -28;
    }
    return { p95FrameMs: times.sort((a, b) => a - b)[Math.floor(times.length * .95)], framesOver34Ms: times.filter((n) => n > 34).length };
  }, selector);
}
async function traceStart(cdp) { await cdp.send("Tracing.start", { categories: "devtools.timeline,disabled-by-default-devtools.timeline,blink,cc,gpu", transferMode: "ReturnAsStream" }); }
async function traceEnd(cdp, label) {
  const finished = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve)); await cdp.send("Tracing.end"); const { stream } = await finished;
  let content = ""; while (true) { const part = await cdp.send("IO.read", { handle: stream }); content += part.data; if (part.eof) break; } await cdp.send("IO.close", { handle: stream });
  await writeFile(path.join(output, `${label}-trace.json`), content);
  const totals = {};
  for (const event of JSON.parse(content).traceEvents) if (event.ph === "X" && ["Paint", "PrePaint", "Layout", "UpdateLayoutTree", "RasterTask", "ImageDecodeTask", "CompositeLayers"].includes(event.name)) totals[event.name] = (totals[event.name] || 0) + (event.dur || 0) / 1000;
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, round(value)]));
}

try {
  const storefront = await start("storefront", 5475); const admin = await start("admin", 5474);
  browser = await chromium.launch({ headless: true, channel: process.env.NUEDE_BROWSER_CHANNEL || "msedge" });
  report.browser = browser.version();
  for (const size of [{ width: 1440, height: 1000, cpu: 1 }, { width: 390, height: 844, cpu: 4 }]) {
    const context = await browser.newContext({ viewport: size, reducedMotion: "reduce" });
    let menuRequests = 0; const errors = [];
    let currentProducts = structuredClone(products);
    await context.route("http://127.0.0.1:54321/**", async (route) => {
      const table = new URL(route.request().url()).pathname.split("/").at(-1);
      const values = { products: currentProducts, categories: [category], product_addons: extras, delivery_zones: [zone], checkout_payment_options: settings, checkout_settings: settings, published_testimonials: [], testimonials: [], feedback: [] };
      if (table === "products") { menuRequests++; await new Promise((resolve) => setTimeout(resolve, 80)); }
      const data = values[table]; assert.notEqual(data, undefined, `Unexpected HTTP ${table}`);
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(data) });
    });
    await context.routeWebSocket("**/realtime/**", (socket) => socket.close());
    const page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.__longTasks = []; window.__shifts = [];
      new PerformanceObserver((list) => window.__longTasks.push(...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration })))).observe({ type: "longtask", buffered: true });
      new PerformanceObserver((list) => window.__shifts.push(...list.getEntries().filter((e) => !e.hadRecentInput).map((e) => e.value))).observe({ type: "layout-shift", buffered: true });
    });
    const cdp = await context.newCDPSession(page); await cdp.send("Performance.enable"); await cdp.send("Emulation.setCPUThrottlingRate", { rate: size.cpu });
    await page.goto(`${storefront}/menu`); await page.getByRole("button", { name: "Choose QA grouped bowl", exact: true }).waitFor(); await page.waitForLoadState("networkidle");
    const menuScroll = await scroll(page, "html");
    const beforeHeap = await metrics(cdp);
    // Within-build A/B isolates each filter. Reuse preserved builds for paired reruns.
    for (const mode of (process.env.NUEDE_PERF_MODES || "original,no-backdrop,no-footer,no-blurs").split(",")) {
      const css = `${["no-backdrop", "no-blurs"].includes(mode) ? "dialog::backdrop { backdrop-filter:none!important; }" : ""} ${["no-footer", "no-blurs"].includes(mode) ? "dialog .sticky.bottom-0 { backdrop-filter:none!important;background:#fff!important; }" : ""}`;
      const style = await page.addStyleTag({ content: css });
      const runs = [];
      for (let run = 0; run < 5; run++) {
        const trigger = page.getByRole("button", { name: "Choose QA grouped bowl", exact: true }); await trigger.scrollIntoViewIfNeeded();
        const beforeRequests = menuRequests;
        await page.evaluate(() => { window.__renders = {}; window.__longTasks = []; });
        const before = await metrics(cdp);
        // Timestamp inside the browser excludes Playwright's pre-click actionability wait.
        await trigger.evaluate((button) => button.addEventListener("click", () => { window.__clickAt = performance.now(); }, { once: true }));
        await trigger.click(); await page.locator("dialog[open] input[type=radio]").first().waitFor();
        const openMs = await page.evaluate(async () => { await new Promise(requestAnimationFrame); return performance.now() - window.__clickAt; });
        const cardsOnOpen = await page.evaluate(() => window.__renders.MenuProductCard || 0);
        if (run === 2) await traceStart(cdp);
        const frames = await scroll(page, "dialog[open]");
        const paint = run === 2 ? await traceEnd(cdp, `${size.width}-${mode}`) : null;
        await page.getByRole("radio", { name: /Meal option 1 / }).check();
        await page.getByRole("radio", { name: /Meal option 2 / }).check();
        await page.getByRole("checkbox", { name: /Extra 1 / }).check(); await page.getByRole("checkbox", { name: /Extra 2 / }).check();
        await page.getByRole("button", { name: "Increase quantity", exact: true }).click(); await page.getByRole("button", { name: "Decrease quantity", exact: true }).click();
        assert.equal(await page.getByRole("button", { name: "Add to basket", exact: true }).isEnabled(), true);
        await page.keyboard.press("Escape"); assert.equal(await trigger.evaluate((el) => document.activeElement === el), true);
        const after = await metrics(cdp);
        runs.push({ openMs, cardsOnOpen, menuRequests: menuRequests - beforeRequests, ...frames, scriptMs: (after.ScriptDuration - before.ScriptDuration) * 1000, layoutMs: (after.LayoutDuration - before.LayoutDuration) * 1000, taskMs: (after.TaskDuration - before.TaskDuration) * 1000, longTasks: await page.evaluate(() => window.__longTasks), paint });
      }
      const summary = Object.fromEntries(["openMs", "cardsOnOpen", "menuRequests", "p95FrameMs", "framesOver34Ms", "scriptMs", "layoutMs", "taskMs"].map((key) => [key, round(median(runs.map((run) => run[key])))]));
      report.scenarios.push({ width: size.width, cpu: size.cpu, mode, menuScroll, summary, runs });
      console.log(size.width, mode, summary); await style.evaluate((el) => el.remove());
      assert.equal(summary.menuRequests, 0, "opening/interacting must not refetch catalog");
      if (phase.startsWith("after")) { assert.equal(summary.cardsOnOpen, 0); assert.ok(summary.openMs < (size.cpu === 1 ? 500 : 1500), "generous dialog regression budget"); }
    }
    const afterHeap = await metrics(cdp);
    report.scenarios.push({ width: size.width, heapBeforeBytes: beforeHeap.JSHeapUsedSize, heapAfterBytes: afterHeap.JSHeapUsedSize, note: "unforced GC; not a retained-memory/leak claim" });
    // Real hook callbacks with burst timing; transport itself remains mocked.
    const requestsBeforeBurst = menuRequests;
    await page.evaluate(async () => { for (let i = 0; i < 10; i++) { window.__catalogSignals.products(); await new Promise((resolve) => setTimeout(resolve, 15)); } window.__catalogSignals.categories(); });
    await page.waitForTimeout(600);
    report.scenarios.push({ width: size.width, burstProductRequests: menuRequests - requestsBeforeBurst });
    // Refreshed catalog must invalidate an open selection, including before submission.
    await page.getByRole("button", { name: "Choose QA grouped bowl", exact: true }).click();
    await page.getByRole("radio", { name: /Meal option 1 / }).check(); await page.getByRole("checkbox", { name: /Extra 1 / }).check();
    currentProducts[0].product_variants[0].status = "sold_out";
    currentProducts[0].product_addon_assignments[0].addon.is_available = false;
    await page.evaluate(() => window.__catalogSignals.products());
    await page.getByText("Your meal option changed and must be selected again.").waitFor();
    assert.equal(await page.getByRole("button", { name: "Add to basket", exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole("checkbox", { name: /Extra 1 / }).isChecked(), false);
    await page.keyboard.press("Escape");
    await page.screenshot({ path: path.join(output, `menu-${size.width}.png`) });
    assert.deepEqual(errors, []); await context.close();
  }
  // Login is intentionally unauthenticated: guard remains outside route chunks.
  const context = await browser.newContext(); const page = await context.newPage();
  await page.goto(`${admin}/menu`); await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
  assert.ok(page.url().includes("/login")); await context.close();
} finally {
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
  await browser?.close(); for (const server of servers) await new Promise((resolve) => server.httpServer.close(resolve));
}
