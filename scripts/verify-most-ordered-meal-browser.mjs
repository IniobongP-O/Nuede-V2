// Real admin UI with synthetic RPC/auth responses; no hosted data is read or changed.
/* global document */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createServer } from "vite";
import { businessDate, rangeForPreset } from "../apps/admin/src/features/analytics/utils/analyticsUtils.js";
import { user, token } from "./cycle18-browser-fixtures.mjs";

process.env.VITE_SUPABASE_URL = "http://127.0.0.1:54321";
process.env.VITE_SUPABASE_ANON_KEY = "most-ordered-meal-public-fixture";
const output = path.resolve("coverage/most-ordered-meal");
await mkdir(output, { recursive: true });
const today = businessDate();
const chicken = { product_id: "chicken", product_name: "Peppered Chicken Bowl", quantity_sold: "12", revenue_kobo: "10000000", quantity_rank: "1", revenue_rank: 2 };
const salmon = { product_id: "salmon", product_name: "Herb Salmon Plate", quantity_sold: 7, revenue_kobo: "14000000", quantity_rank: 2, revenue_rank: 1 };
const green = { product_id: "green", product_name: "Green Protein Plate", quantity_sold: 1, revenue_kobo: "1000000", quantity_rank: 1, revenue_rank: 1 };
const longMeal = { ...chicken, product_name: `Peppered Chicken Bowl ${"LongMealName".repeat(14)}`, quantity_sold: "1234567890123" };
const calls = [];
const errors = [];
const checks = [];
let holdAnalytics = true;
let releaseAnalytics;
let failAnalytics = false;

function analytics(from, to) {
  const empty = from === today && to === today;
  const rows = empty || from === rangeForPreset("90d", today).from ? []
    : from === rangeForPreset("7d", today).from ? [green]
    : from === "2000-01-01" ? [longMeal] : [salmon, chicken];
  return {
    summary: { revenue_kobo: empty ? "0" : "24000000", paid_orders: empty ? 0 : 3, average_order_value_kobo: empty ? "0" : "8000000", items_sold: empty ? 0 : 19 },
    daily_sales: empty ? [] : [{ date: to, revenue_kobo: "24000000", paid_orders: 3 }],
    product_sales: rows,
    variant_sales: empty ? [] : [5, 4, 3].map((quantity, index) => ({ product_name: chicken.product_name, variant_name: ["Rice", "Pasta", "Potatoes"][index], quantity_sold: quantity, revenue_kobo: "1000000" })),
    addon_sales: empty ? [] : [{ addon_name: "Popular sauce", quantity_sold: 100, revenue_kobo: "1000000" }],
    delivery_zone_sales: [], payment_method_sales: [], order_type_sales: [],
    order_activity: { total_orders: empty ? 0 : 3, cancelled_orders: 0, failed_payments: 0 },
  };
}

const server = await createServer({ root: path.resolve("apps/admin"), server: { host: "127.0.0.1", port: 5576, strictPort: true }, logLevel: "error" });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, channel: process.env.NUEDE_BROWSER_CHANNEL || "msedge" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await context.route("http://127.0.0.1:54321/**", async (route) => {
    const request = route.request();
    const endpoint = new URL(request.url()).pathname.split("/").at(-1);
    const respond = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    if (request.method() === "OPTIONS") return respond({});
    if (endpoint === "token") return respond({ access_token: token, refresh_token: "qa-refresh", token_type: "bearer", expires_in: 3600, user });
    if (endpoint === "user") return respond(user);
    if (endpoint === "admin_users") return respond({ ...user, display_name: "QA administrator", role: "admin", is_active: true });
    assert.equal(endpoint, "get_admin_sales_analytics", "Only the existing analytics RPC should be requested");
    const { p_from, p_to } = request.postDataJSON();
    calls.push({ from: p_from, to: p_to });
    if (holdAnalytics) await new Promise((resolve) => { releaseAnalytics = resolve; });
    return failAnalytics ? respond({ message: "Fixture analytics outage" }, 503) : respond(analytics(p_from, p_to));
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5576/analytics");
  await page.getByLabel("Email address", { exact: false }).fill(user.email);
  await page.getByLabel("Password", { exact: false }).fill("QA-browser-only-123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const card = page.locator("section").filter({ has: page.getByRole("heading", { name: "Most ordered meal", exact: true }) });
  const loading = page.getByLabel("Loading most ordered meal");
  const range = page.getByLabel("Date range", { exact: true });
  await expect(loading).toBeVisible();
  await expect(card).not.toContainText("units sold");
  await expect.poll(() => Boolean(releaseAnalytics)).toBe(true);
  holdAnalytics = false;
  releaseAnalytics();
  await expect(card).toContainText(chicken.product_name);
  await expect(card).toContainText("12 units sold");
  const topProducts = page.getByRole("region", { name: "Top products table" });
  await expect(topProducts.locator("tbody tr").first()).toContainText(salmon.product_name);
  await expect(page.getByRole("region", { name: "Variant sales table" }).locator("tbody tr")).toHaveCount(3);
  await expect(page.getByRole("region", { name: "Add-on sales table" })).toContainText("100");
  assert.equal(calls.length, 1, "The new card must not make a second analytics request");
  await page.screenshot({ path: path.join(output, "desktop.png"), fullPage: true });
  checks.push("Initial skeleton; backend quantity winner differs from revenue winner; grouped base quantity and separate add-ons/variants; one RPC");

  holdAnalytics = true;
  releaseAnalytics = null;
  await range.selectOption("7d");
  await expect(loading).toBeVisible();
  await expect(card).not.toContainText(chicken.product_name);
  await expect.poll(() => Boolean(releaseAnalytics)).toBe(true);
  holdAnalytics = false;
  releaseAnalytics();
  await expect(card).toContainText(green.product_name);
  await expect(card).toContainText("1 unit sold");
  assert.deepEqual(calls.at(-1), { from: rangeForPreset("7d", today).from, to: today });
  checks.push("7-day range replaces previous meal; no stale meal while pending; singular quantity wording");

  await range.selectOption("90d");
  await expect(card).toContainText("No meal sales in this period");
  await range.selectOption("today");
  await expect(page.getByRole("heading", { name: "No verified paid sales in this period" })).toBeVisible();
  await expect(card).toHaveCount(0);
  await range.selectOption("30d");
  await expect(card).toContainText(chicken.product_name);
  checks.push("90-day paid summary with empty product_sales; Today overall empty state; return to populated 30-day period");

  await range.selectOption("custom");
  await page.getByLabel("Start date", { exact: true }).fill("2000-01-01");
  await page.getByLabel("End date", { exact: true }).fill("2000-01-02");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(card).toContainText(longMeal.product_name);
  await expect(card).toContainText("1,234,567,890,123 units sold");
  assert.deepEqual(calls.at(-1), { from: "2000-01-01", to: "2000-01-02" });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(card).toBeVisible();
    await page.screenshot({ path: path.join(output, `page-${width}.png`), fullPage: true });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), { message: `Page overflow at ${width}px` }).toBe(true);
    assert.equal(await card.evaluate((element) => element.scrollWidth <= element.clientWidth), true, `Card overflow at ${width}px`);
    await card.screenshot({ path: path.join(output, `card-${width}.png`) });
  }
  const accessibility = await new AxeBuilder({ page }).include("section:has(> p.wrap-anywhere)").analyze();
  assert.deepEqual(accessibility.violations, []);
  checks.push("Custom range; long unbroken meal name and large quantity; no overflow at 320/390/768/1024/1440px; card accessibility");

  failAnalytics = true;
  await page.getByLabel("Start date", { exact: true }).fill("2000-02-01");
  await page.getByLabel("End date", { exact: true }).fill("2000-02-02");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Unable to load sales analytics" })).toBeVisible();
  await expect(card).toHaveCount(0);
  failAnalytics = false;
  await page.getByRole("button", { name: "Retry analytics" }).click();
  await expect(card).toContainText(chicken.product_name);
  await expect(page.getByRole("heading", { name: "Revenue over time" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Paid orders over time" })).toBeVisible();
  await expect(topProducts.locator("tbody tr").first()).toContainText(salmon.product_name);
  checks.push("Shared error hides card; existing retry restores data, charts, and revenue ranking");
  assert.deepEqual(errors, []);
  console.log(checks.join("\n"));
} finally {
  releaseAnalytics?.();
  await writeFile(path.join(output, "report.json"), JSON.stringify({ checks, calls, errors }, null, 2));
  await browser?.close();
  await server.close();
}
