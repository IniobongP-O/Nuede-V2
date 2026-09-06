// Browser integration with mocked HTTP, database persistence, and Paystack.
// Real UI + order validation/pricing/snapshots; NOT hosted or database launch proof.
/* global window, document */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { createServer } from "vite";
import { createAuthoritativeOrder } from "../supabase/functions/_shared/order/engine.js";
import { createWhatsappOrder } from "../supabase/functions/create-whatsapp-order/handler.js";
import { createPaystackCheckout } from "../supabase/functions/initialize-paystack/handler.js";
import { canTransitionFulfilmentStatus } from "../packages/domain/src/orders.js";

const layoutOnly = process.env.NUEDE_BROWSER_PHASE === "layout";
const output = path.resolve("coverage/cycle18");
await mkdir(output, { recursive: true });
process.env.VITE_SUPABASE_URL = "http://127.0.0.1:54321";
process.env.VITE_SUPABASE_ANON_KEY = "cycle18-browser-public-fixture";
import { id, category, meal, addons, variant, grouped, products, zone, settings, user, token } from "./cycle18-browser-fixtures.mjs";
let persona = "owner";
let analyticsFailure = false;
const orders = [];
const reports = [];
const violations = [];
const layoutViolations = [];
const exceptions = [];
const servers = [];
const payloads = [];
const imageUploads = [];
let browser;

function orderContext() { return { products, variants: [variant], addons, assignments: addons.map((addon) => ({ product_id: grouped.id, addon_id: addon.id })), deliveryZone: zone, checkoutSettings: settings }; }
async function persist(_client, snapshot) {
  const order = { ...structuredClone(snapshot.order), id: id(1000 + orders.length), order_reference: `NUE-QA${1000 + orders.length}`, payment_status: "unpaid", fulfilment_status: "pending", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), order_items: snapshot.items.map((item, i) => ({ ...structuredClone(item), id: id(2000 + orders.length * 10 + i), order_item_addons: item.addons.map((addon, j) => ({ ...addon, id: id(3000 + j) })) })), payments: [] };
  orders.push(order);
  return { order_id: order.id, order_reference: order.order_reference, created_at: order.created_at, payment_status: order.payment_status, fulfilment_status: order.fulfilment_status };
}
const createOrder = (candidate, client, dependencies = {}) => createAuthoritativeOrder(candidate, client, { loadContext: async () => orderContext(), persist, ...dependencies });
function analytics() {
  const paid = orders.filter((order) => order.payment_status === "paid");
  const revenue = paid.reduce((total, order) => total + order.total_kobo, 0);
  return { order_activity: { total_orders: orders.length, cancelled_orders: 0, failed_payments: 0 }, order_type_sales: ["cart", "meal_plan"].map((type) => ({ order_type: type, paid_orders: paid.filter((o) => o.order_type === type).length, revenue_kobo: String(paid.filter((o) => o.order_type === type).reduce((sum, o) => sum + o.total_kobo, 0)) })), summary: { revenue_kobo: String(revenue), paid_orders: paid.length, average_order_value_kobo: String(paid.length ? Math.round(revenue / paid.length) : 0), items_sold: paid.flatMap((o) => o.order_items).reduce((s, i) => s + i.quantity, 0) }, daily_sales: [{ date: "2026-09-04", revenue_kobo: String(revenue), paid_orders: paid.length }], product_sales: [], variant_sales: [], addon_sales: [], delivery_zone_sales: paid.length ? [{ delivery_zone_id: zone.id, delivery_zone_name: zone.name, revenue_kobo: String(revenue), paid_orders: paid.length, delivery_fee_kobo: String(paid.length * zone.fee_kobo) }] : [], payment_method_sales: paid.length ? [{ payment_method: "paystack", revenue_kobo: String(revenue), revenue_share_percent: 100 }] : [] };
}
async function mock(route) {
  const request = route.request(); const url = new URL(request.url()); const table = url.pathname.split("/").at(-1);
  const respond = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data), headers: { "access-control-allow-origin": "*", "content-range": "0-0/0" } });
  if (request.method() === "OPTIONS") return respond({});
  if (url.pathname.startsWith("/storage/v1/object/product-images/") && request.method() === "POST") {
    console.log("NUEDE image: intercepted upload");
    assert.match(request.postDataBuffer().toString(), /31536000/);
    assert.equal(request.headers()["x-upsert"], "false");
    imageUploads.push(url.pathname);
    return respond({ Key: url.pathname.split("/object/")[1] });
  }
  if (table === "token") return respond({ access_token: token, refresh_token: "qa-refresh", token_type: "bearer", expires_in: 3600, user });
  if (table === "user") return persona === "expired" ? respond({ message: "Expired", code: "bad_jwt" }, 401) : respond(user);
  if (table === "logout") return respond({});
  if (table === "admin_users") return respond(persona === "nonadmin" ? null : { ...user, display_name: "QA administrator with a long display name", role: persona === "editor" ? "editor" : persona === "owner" ? "owner" : "admin", is_active: persona !== "inactive" });
  if (table === "products") return respond(products);
  if (table === "categories") return respond([category]);
  if (table === "product_addons") return respond(addons);
  if (table === "delivery_zones") return respond([zone]);
  if (table === "checkout_payment_options" || table === "checkout_settings") return respond(settings);
  if (["published_testimonials", "testimonials", "feedback"].includes(table)) return respond([]);
  if (table === "list_admin_orders") return respond(orders.map((o) => ({ ...o, total_count: orders.length, item_count: o.order_items.length })));
  if (table === "orders") return respond(orders.find((o) => `eq.${o.order_reference}` === url.searchParams.get("order_reference")) || null);
  if (table === "get_admin_sales_analytics") return analyticsFailure ? respond({ message: "fixture outage" }, 503) : respond(analytics());
  if (table === "update_order_fulfilment_status") {
    const body = request.postDataJSON(); const order = orders.find((o) => o.id === body.p_order_id);
    assert.equal(canTransitionFulfilmentStatus(order.fulfilment_status, body.p_next_status), true);
    order.fulfilment_status = body.p_next_status;
    return respond(order);
  }
  if (table === "delete_admin_order") {
    const body = request.postDataJSON();
    if (persona !== "owner") return respond({ message: "OWNER_ACCESS_REQUIRED" }, 403);
    const index = orders.findIndex((order) => order.id === body.p_order_id);
    if (index < 0) return respond({ message: "ORDER_NOT_FOUND" }, 404);
    if (orders[index].order_reference !== body.p_confirmation) return respond({ message: "ORDER_DELETE_CONFIRMATION_MISMATCH" }, 400);
    const [deleted] = orders.splice(index, 1);
    return respond({ order_id: deleted.id, order_reference: deleted.order_reference, deleted: true });
  }
  if (table === "create-whatsapp-order" || table === "initialize-paystack") {
    const candidate = request.postDataJSON(); payloads.push(candidate);
    try {
      if (table === "create-whatsapp-order") return respond({ order: await createWhatsappOrder(candidate, null, { recipient: "2348000000000", createOrder }) }, 201);
      const reference = `NUE-QA-PAY-${orders.length}`;
      const payment = await createPaystackCheckout(candidate, null, {
        storefrontUrl: "http://127.0.0.1:5375/", secretKey: "fixture-only", createOrder, createReference: () => reference,
        persistAttempt: async (client, snapshot) => { const saved = await persist(client, snapshot); const order = orders.at(-1); order.payment_status = "pending"; order.payments.push({ id: id(4000 + orders.length), status: "pending", verification_status: "unverified", provider_reference: reference, amount_kobo: order.total_kobo, provider: "paystack", payment_method: "paystack", created_at: order.created_at }); return { ...saved, payment_status: "pending", payment_id: order.payments[0].id, provider_reference: reference }; },
        initializeTransaction: async () => ({ authorization_url: `https://checkout.paystack.com/${reference}` }),
      });
      return respond({ payment }, 201);
    } catch (error) { return respond({ error: { code: error.code, message: error.message } }, error.status || 500); }
  }
  if (table === "verify-paystack-payment") {
    const { reference } = request.postDataJSON(); const order = orders.find((o) => o.payments[0]?.provider_reference === reference);
    if (!order) return respond({ error: { code: "PAYMENT_NOT_FOUND", message: "Payment not found" } }, 404);
    return respond({ payment: { status: order.payment_status, paymentStatus: order.payment_status, amountKobo: order.total_kobo, orderReference: order.order_reference, paymentReference: reference, fulfilmentStatus: order.fulfilment_status } });
  }
  throw new Error(`Unexpected fixture request: ${request.method()} ${url.pathname}`);
}
async function start(app, port) {
  const server = await createServer({ root: path.resolve(`apps/${app}`), server: { host: "127.0.0.1", port, strictPort: true }, logLevel: "error" });
  await server.listen(); servers.push(server); return `http://127.0.0.1:${port}`;
}
async function check(page, label, { axe = true } = {}) {
  await page.getByRole("heading").first().waitFor();
  await page.waitForLoadState("networkidle");
  assert.equal(await page.locator("vite-error-overlay").count(), 0, label);
  if (!await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)) {
    const elements = await page.evaluate(() => [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > window.innerWidth + 1 && !e.closest("[aria-hidden=true]"); }).slice(0, 20).map((e) => ({ tag: e.tagName, text: e.textContent.slice(0, 100), classes: e.className })));
    layoutViolations.push({ label, metrics: await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth })), elements });
    await page.screenshot({ path: path.join(output, label.replace(/[^a-z0-9]/gi, "-") + ".png") });
  }
  if (axe) {
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    for (const item of result.violations) violations.push({ label, id: item.id, impact: item.impact, nodes: item.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })) });
  }
  reports.push(label);
  if (/^(storefront home|admin dashboard) (390|1440)$/.test(label)) await page.screenshot({ path: path.join(output, label.replaceAll(" ", "-") + ".png"), fullPage: true });
}
async function fillCheckout(page, method) {
  await page.getByLabel("Full name", { exact: false }).fill("QA customer");
  await page.getByLabel("Phone number", { exact: false }).fill("08000000000");
  await page.getByLabel("Email", { exact: true }).fill("qa-customer@example.com");
  await page.getByLabel("Street address", { exact: false }).fill("18 QA Street, Abuja");
  await page.getByLabel("Delivery area", { exact: false }).selectOption(zone.id);
  await page.getByRole("radio", { name: method === "paystack" ? /Pay with Paystack/ : /Continue on WhatsApp/ }).check();
}
async function addGrouped(page, submit = "Add to basket") {
  await page.getByRole("radio", { name: /QA rice option/ }).check();
  for (const addon of addons) await page.getByRole("checkbox", { name: new RegExp(addon.name) }).check();
  await page.getByRole("button", { name: submit, exact: true }).click();
}
try {
  browser = await chromium.launch({ headless: true, channel: process.env.NUEDE_BROWSER_CHANNEL || "msedge" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  context.setDefaultTimeout(10000);
  await context.route("http://127.0.0.1:54321/**", async (route) => { try { await mock(route); } catch (error) { exceptions.push(error.message); await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Fixture failure" }) }); } });
  await context.route("https://wa.me/**", (route) => route.fulfill({ contentType: "text/html", body: "<h1>Mock WhatsApp handoff</h1>" }));
  await context.routeWebSocket("**/realtime/**", (socket) => socket.close());
  await context.route("https://checkout.paystack.com/**", (route) => route.fulfill({ contentType: "text/html", body: "<h1>Mock hosted Paystack</h1>" }));
  const page = await context.newPage(); page.on("pageerror", (e) => exceptions.push(e.message));
  const storefront = await start("storefront", 5375);
  await page.goto(storefront); await page.getByRole("button", { name: "Quick add QA standard meal", exact: true }).waitFor();
  await check(page, "storefront initial render");
  console.log("PASS storefront browser startup");
  const adminPage = await context.newPage(); adminPage.on("pageerror", (e) => exceptions.push(e.message));
  const admin = await start("admin", 5374);
  await adminPage.goto(`${admin}/orders`); await adminPage.getByRole("button", { name: "Sign in", exact: true }).waitFor(); await check(adminPage, "admin guarded startup");
  console.log("PASS admin browser startup and logged-out guard");
  for (const route of ["dashboard", "menu", "orders", "analytics", "delivery", "testimonials", "feedback", "settings"]) {
    await adminPage.goto(`${admin}/${route}`); await adminPage.getByRole("button", { name: "Sign in", exact: true }).waitFor(); assert.ok(adminPage.url().includes("/login"));
  }
  await adminPage.getByLabel("Email address", { exact: false }).fill(user.email);
  await adminPage.getByLabel("Password", { exact: false }).fill("QA-browser-only-123!");
  await adminPage.getByRole("button", { name: "Sign in", exact: true }).click();
  await adminPage.getByRole("heading", { name: "Settings", exact: true }).waitFor();

  if (!layoutOnly) {
    adminPage.on("console", (message) => { if (message.text().startsWith("NUEDE image:")) console.log(message.text()); });
    let imageTimeout;
    const imageResult = await Promise.race([adminPage.evaluate(async (entityId) => {
      console.log("NUEDE image: importing adapter");
      const { prepareCatalogImage, uploadCatalogImage } = await import("/src/features/catalog/api/imageApi.js");
      console.log("NUEDE image: creating source");
      const canvas = document.createElement("canvas"); canvas.width = 2400; canvas.height = 1200;
      const context = canvas.getContext("2d"); context.fillStyle = "#245c3e"; context.fillRect(0, 0, 2400, 1200);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg"));
      const file = new window.File([blob], "fixture.jpg", { type: "image/jpeg" });
      console.log("NUEDE image: optimizing");
      const optimized = await prepareCatalogImage(file); const decoded = await window.createImageBitmap(optimized);
      const result = { type: optimized.type, width: decoded.width, height: decoded.height, rejected: [] }; decoded.close();
      for (const candidate of [new window.File(["text"], "bad.txt", { type: "text/plain" }), new window.File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" }), new window.File(["corrupt"], "bad.png", { type: "image/png" })]) {
        console.log(`NUEDE image: rejecting ${candidate.name}`);
        try { await prepareCatalogImage(candidate); result.rejected.push(false); } catch { result.rejected.push(true); }
      }
      console.log("NUEDE image: uploading");
      result.paths = [];
      result.paths.push(await uploadCatalogImage({ file, entityType: "product", entityId }));
      result.paths.push(await uploadCatalogImage({ file, entityType: "product", entityId }));
      return result;
    }, grouped.id), new Promise((_, reject) => { imageTimeout = setTimeout(() => reject(new Error("Image processing/upload fixture exceeded 30 seconds")), 30000); })]).finally(() => clearTimeout(imageTimeout));
    assert.equal(imageResult.type, "image/webp"); assert.equal(imageResult.width, 1600); assert.equal(imageResult.height, 800);
    assert.deepEqual(imageResult.rejected, [true, true, true]); assert.notEqual(imageResult.paths[0], imageResult.paths[1]); assert.equal(imageUploads.length, 2);
    reports.push("catalog image WebP/downscale/rejection and unique long-cache upload contract (mocked Storage)");

    await page.goto(`${storefront}/menu`);
    await page.getByLabel("Search the menu", { exact: true }).fill("grouped");
    await page.getByRole("button", { name: "Choose QA grouped bowl", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Customize QA standard meal", exact: true }).count(), 0);
    await page.getByLabel("Search the menu", { exact: true }).fill("");
    await page.getByRole("button", { name: "Grouped meals", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Customize QA standard meal", exact: true }).count(), 0);
    await page.getByRole("button", { name: "Grouped meals", exact: true }).click();
    await page.getByRole("button", { name: "QA kitchen", exact: true }).click();
    await page.getByRole("button", { name: "Customize QA standard meal", exact: true }).waitFor();
    await page.getByRole("button", { name: "Available only", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "View details for QA sold out", exact: true }).count(), 0);
    await page.getByRole("button", { name: "Save QA grouped bowl", exact: true }).click();
    await page.goto(`${storefront}/saved`); await page.getByRole("button", { name: "Choose QA grouped bowl", exact: true }).waitFor();
    await page.reload(); await page.getByRole("button", { name: "Remove QA grouped bowl from saved meals", exact: true }).click();
    await check(page, "performance saved meal persistence and removal");
    reports.push("menu search, category and composed filters after memoization");
    await page.goto(`${storefront}/menu`);
    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: "Customize QA standard meal", exact: true }).click();
      await page.getByRole("button", { name: "Add to basket", exact: true }).click();
    }
    await page.getByRole("button", { name: /Open basket, 2 items/ }).click();
    assert.equal(await page.locator("dialog[open] li").count(), 1, "identical configurations merge");
    await page.getByRole("button", { name: "Increase QA standard meal quantity", exact: true }).click();
    await page.getByRole("button", { name: "Decrease QA standard meal quantity", exact: true }).click();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await page.getByRole("button", { name: "Increase quantity", exact: true }).click();
    await page.getByRole("button", { name: "Update basket", exact: true }).click();
    await page.keyboard.press("Escape"); await page.reload();
    await page.getByRole("button", { name: /Open basket, 3 items/ }).click();
    await check(page, "performance basket merge, quantity, edit and persisted result");
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await page.getByRole("heading", { name: "Your basket is empty", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page.goto(`${storefront}/planner`);
    for (const days of [2, 3, 4, 5, 6, 7]) {
      await page.getByRole("button", { name: `${days} days`, exact: true }).click();
      assert.equal(await page.getByRole("button", { name: `${days} days`, exact: true }).getAttribute("aria-pressed"), "true");
    }
    await page.getByRole("button", { name: "2 days", exact: true }).click();
    await page.locator(`[data-planner-product="${meal.id}"]`).getByRole("button", { name: "Quick add", exact: true }).click();
    await page.getByRole("button", { name: "Replace", exact: true }).click();
    await page.locator(`[data-planner-product="${grouped.id}"]`).getByRole("button", { name: "Choose for slot", exact: true }).click();
    await page.getByRole("radio", { name: /QA rice option/ }).check();
    await page.locator("dialog[open]").getByRole("button", { name: /Place in/ }).click();
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    reports.push("planner 2–7 day selection, replace and remove");
  }

  for (const scenario of (layoutOnly ? [] : ["standard-whatsapp", "standard-paystack", "grouped-paystack", "plan-whatsapp", "plan-paystack"])) {
    const plan = scenario.startsWith("plan"); const groupedFlow = scenario.startsWith("grouped"); const method = scenario.endsWith("paystack") ? "paystack" : "whatsapp";
    await page.goto(`${storefront}/${plan ? "planner" : "menu"}`);
    if (plan) {
      await page.getByRole("button", { name: "2 days", exact: true }).click();
      await page.locator(`[data-planner-product="${meal.id}"]`).getByRole("button", { name: "Quick add", exact: true }).click();
      await page.locator(`[data-planner-product="${grouped.id}"]`).getByRole("button", { name: "Quick add", exact: true }).click();
      await addGrouped(page, "Add to next empty slot");
      await page.reload(); await page.getByRole("link", { name: "Continue to checkout", exact: true }).waitFor();
      await check(page, `${scenario} persisted planner`);
      await page.getByRole("link", { name: "Continue to checkout", exact: true }).click();
    } else {
      if (groupedFlow) {
        await page.getByRole("button", { name: "Choose QA grouped bowl", exact: true }).click();
        for (const width of [320, 390]) { await page.setViewportSize({ width, height: 900 }); await check(page, `grouped configuration dialog ${width}`); }
        await page.setViewportSize({ width: 1440, height: 1000 }); await addGrouped(page);
      }
      else { await page.getByRole("button", { name: "Customize QA standard meal", exact: true }).click(); await page.getByRole("button", { name: "Add to basket", exact: true }).click(); }
      await page.reload();
      await page.getByRole("button", { name: /Open basket, 1 item/ }).click();
      await check(page, `${scenario} persisted basket`);
      await page.getByRole("link", { name: /checkout/i }).last().click();
    }
    await fillCheckout(page, method); await check(page, `${scenario} checkout`);
    if (groupedFlow || scenario === "plan-paystack") {
      for (const width of [320, 390, 768, 1024, 1440]) { await page.setViewportSize({ width, height: 900 }); await check(page, `${scenario} filled checkout ${width}`, { axe: width === 320 || width === 1440 }); }
      await page.screenshot({ path: path.join(output, `${scenario}-checkout.png`), fullPage: true });
    }
    const before = orders.length;
    await page.getByRole("button", { name: method === "paystack" ? "Pay with Paystack" : "Continue on WhatsApp", exact: true }).click();
    if (method === "paystack") {
      await page.waitForURL("https://checkout.paystack.com/**");
      const order = orders.at(-1);
      assert.equal(order.payment_status, "pending");
      // Explicit fixture transition: this does NOT verify a real provider payment.
      order.payment_status = "paid"; Object.assign(order.payments[0], { status: "paid", verification_status: "verified", verified_at: new Date().toISOString() });
      await page.goto(`${storefront}/payment?reference=${order.payments[0].provider_reference}`);
      await page.getByRole("heading", { name: "Payment successful", exact: true }).waitFor();
    } else {
      await page.getByText(/NUE-QA\d+/).first().waitFor();
      assert.equal(orders.at(-1).payment_status, "unpaid");
    }
    assert.equal(orders.length, before + 1);
    const order = orders.at(-1);
    assert.equal(order.total_kobo, (plan ? 1900000 : groupedFlow ? 1100000 : 800000) + 200000);
    if (plan) assert.ok(order.order_items.every((item) => item.scheduled_for && item.meal_slot));
    await adminPage.goto(`${admin}/orders/${order.order_reference}`);
    await adminPage.getByRole("button", { name: "Mark Confirmed", exact: true }).waitFor();
    await check(adminPage, `${scenario} admin snapshots`);
    for (const state of ["Confirmed", "Preparing", "Ready", "Out for delivery", "Delivered"]) await adminPage.getByRole("button", { name: `Mark ${state}`, exact: true }).click();
    await adminPage.getByText("This order is in a terminal fulfilment state.", { exact: false }).waitFor();
    assert.equal(order.fulfilment_status, "delivered");
    assert.equal(order.payment_status, method === "paystack" ? "paid" : "unpaid");
    console.log(`PASS mocked browser journey: ${scenario}`);
  }
  if (layoutOnly) {
    for (let i=0;i<3;i++) await createOrder({ orderType: "cart", customer: { fullName: "QA customer", phone: "08000000000", email: "qa@example.com", address: "18 QA Street", landmark: "" }, deliveryZoneId: zone.id, paymentMethod: "whatsapp", items: [{ productId: meal.id, variantId: null, addonIds: [], quantity: 1 }] }, null);
  }
  if (!layoutOnly) assert.equal(payloads.length, 5);
  assert.ok(payloads.every((p) => !JSON.stringify(p).includes("price")), "browser submits IDs, never pricing authority");
  if (!layoutOnly) assert.equal(analytics().summary.paid_orders, 3);
  if (!layoutOnly) assert.equal(analytics().summary.revenue_kobo, "4400000");
  await page.goto(`${storefront}/payment?status=success&reference=fake`); await page.getByRole("heading", { name: "Use a valid payment link" }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Payment successful" }).count(), 0);
  for (const width of [320, 390, 768, 1024, 1440]) {
    console.log(`Checking full route matrix at ${width}px`);
    await page.setViewportSize({ width, height: 900 }); await adminPage.setViewportSize({ width, height: 900 });
    for (const route of ["", "menu", "saved", "planner", "checkout?source=cart", "payment?status=success"]) { await page.goto(`${storefront}/${route}`); await check(page, `storefront ${route || "home"} ${width}`, { axe: width === 320 || width === 1440 }); }
    for (const route of ["dashboard", "menu", "orders", `orders/${orders[2].order_reference}`, "analytics", "delivery", "testimonials", "feedback", "settings"]) { await adminPage.goto(`${admin}/${route}`); await check(adminPage, `admin ${route} ${width}`, { axe: width === 320 || width === 1440 }); }
  }
  const deletionTarget = orders.at(-1);
  await adminPage.goto(`${admin}/orders/${deletionTarget.order_reference}`);
  await adminPage.getByRole("button", { name: "Delete order", exact: true }).click();
  await adminPage.getByRole("heading", { name: `Permanently delete ${deletionTarget.order_reference}?`, exact: true }).waitFor();
  assert.equal(await adminPage.getByRole("button", { name: "Permanently delete", exact: true }).isDisabled(), true);
  await adminPage.getByLabel(`Type ${deletionTarget.order_reference} to confirm`, { exact: true }).fill(deletionTarget.order_reference);
  await adminPage.getByRole("button", { name: "Permanently delete", exact: true }).click();
  await adminPage.getByText(`${deletionTarget.order_reference} was permanently deleted.`, { exact: true }).waitFor();
  assert.equal(orders.some((order) => order.id === deletionTarget.id), false);
  assert.match(adminPage.url(), /\/orders(?:\?|$)/);
  reports.push("owner exact-reference order deletion and post-delete navigation");
  analyticsFailure = true;
  for (const route of ["dashboard", "analytics"]) {
    await adminPage.goto(`${admin}/${route}`);
    await adminPage.getByRole("heading", { name: route === "dashboard" ? "Dashboard sales metrics are unavailable" : "Unable to load sales analytics" }).waitFor();
    assert.equal(await adminPage.getByText("Revenue", { exact: true }).count(), 0, "failed query never masquerades as zero revenue");
  }
  analyticsFailure = false;
  for (const role of ["editor", "inactive", "nonadmin", "expired"]) {
    persona = role; await adminPage.goto(`${admin}/settings`);
    if (role === "editor") { await adminPage.getByText("Only owners and administrators can change payment methods.").waitFor(); assert.equal(await adminPage.getByRole("button", { name: "Save checkout settings" }).isDisabled(), true); }
    else { await adminPage.getByRole("heading", { name: /inactive|access|Welcome back|not a Nuede administrator/i }).waitFor(); assert.equal(await adminPage.getByRole("button", { name: "Save checkout settings" }).count(), 0); }
  }
  await page.screenshot({ path: path.join(output, "storefront-desktop.png"), fullPage: true });
  assert.deepEqual(exceptions, [], "no uncaught runtime exceptions");
  await writeFile(path.join(output, "browser-report.json"), JSON.stringify({ scope: "mocked UI integration, not live RLS/provider proof", phase: layoutOnly ? "layout" : "full", checks: reports, violations, layoutViolations, exceptions }, null, 2));
  assert.deepEqual(layoutViolations, [], "responsive overflow; see browser-report.json");
  assert.deepEqual(violations, [], "WCAG A/AA violations; see coverage/cycle18/browser-report.json");
  console.log(`PASS ${reports.length} UI checks, phase=${layoutOnly ? "layout diagnostic" : "all five mocked journeys"}, five widths, axe accessibility and error/auth states`);
} finally {
  await writeFile(path.join(output, "browser-report.json"), JSON.stringify({ scope: "mocked UI integration, not live RLS/provider proof", phase: layoutOnly ? "layout" : "full", checks: reports, violations, layoutViolations, exceptions }, null, 2));
  await browser?.close(); for (const server of servers) await server.close();
}
