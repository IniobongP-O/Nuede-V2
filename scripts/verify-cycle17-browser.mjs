// UI integration with explicitly mocked HTTP responses. This is not RLS proof.
// Uses installed Playwright, or NUEDE_BROWSER_MODULES pointing to bundled modules.
/* global window, document */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "vite";

const playwright = process.env.NUEDE_BROWSER_MODULES
  ? await import(pathToFileURL(path.join(process.env.NUEDE_BROWSER_MODULES, "playwright/index.mjs")))
  : await import("playwright");
const root = process.cwd();
const output = path.join(root, "coverage/cycle17");
await mkdir(output, { recursive: true });
// Process-local test configuration never modifies either application's env file.
process.env.VITE_SUPABASE_URL = "http://127.0.0.1:54321";
process.env.VITE_SUPABASE_ANON_KEY = "cycle17-browser-public-fixture";
const servers = [];
let browser;
const requests = [];
const exceptions = [];
const feedback = [];
const testimonials = [];
let failSubmission = false;
let failTestimonials = false;
let failMutation = false;
let failMenu = false;
let emptyMenu = false;
const id = (n) => `17000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const category = { id: id(100), name: "Test kitchen", slug: "test-kitchen", is_enabled: true, sort_order: 0 };
const meal = { id: id(101), name: "Browser test meal", category_id: category.id, category, product_type: "standard", description: "Test meal from the mocked live catalog", price_kobo: 850000, calories: 600, protein_g: 40, carbohydrates_g: 60, fat_g: 20, image_path: null, status: "available", sort_order: 1, product_variants: [], product_addon_assignments: [] };
const products = [meal, { ...meal, id: id(102), name: "Sold-out test meal", status: "sold_out", sort_order: 2 }, { ...meal, id: id(103), name: "Grouped test meal", product_type: "grouped", price_kobo: null, requires_variant_selection: true, product_variants: [{ id: id(104), product_id: id(103), name: "Rice option", price_kobo: 900000, status: "available", calories: 600, protein_g: 40, carbohydrates_g: 60, fat_g: 20, sort_order: 1 }] }];
const user = { id: id(999), email: "browser-admin@example.com", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.browser-test`;

async function mock(route) {
  const request = route.request();
  const url = new URL(request.url());
  const method = request.method();
  requests.push({ method, pathname: url.pathname, search: url.search, body: request.postData() });
  const respond = (data, status = 200, count) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data), headers: { "access-control-allow-origin": "*", ...(count !== undefined ? { "content-range": `0-${Math.max(0, count - 1)}/${count}`, "access-control-expose-headers": "content-range" } : {}) } });
  if (method === "OPTIONS") return respond({});
  if (url.pathname.endsWith("/auth/v1/token")) return respond({ access_token: token, token_type: "bearer", expires_in: 3600, refresh_token: "browser-test-refresh", user });
  if (url.pathname.endsWith("/auth/v1/user")) return respond(user);
  const table = url.pathname.split("/").at(-1);
  if (table === "admin_users") return respond({ ...user, display_name: "Test admin", role: "admin", is_active: true });
  if (table === "products") return failMenu ? respond({ message: "fixture failure" }, 503) : respond(emptyMenu ? [] : products);
  if (table === "categories") return respond([category]);
  if (table === "published_testimonials") return failTestimonials ? respond({ message: "fixture failure" }, 503) : respond(testimonials.filter((item) => item.is_published).map(({ id, customer_name, message, rating }) => ({ id, customer_name, message, rating })));
  if (table === "feedback" && method === "POST") {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (failSubmission) return respond({ message: "private raw database failure", code: "XX000" }, 503);
    feedback.push({ ...request.postDataJSON(), id: id(feedback.length + 1), created_at: new Date().toISOString() });
    return route.fulfill({ status: 201, body: "", headers: { "access-control-allow-origin": "*" } });
  }
  if (table === "testimonials" && method !== "GET") {
    if (failMutation) return respond({ message: "private mutation failure" }, 503);
    const record = request.postDataJSON();
    const target = testimonials.find((item) => `eq.${item.id}` === url.searchParams.get("id"));
    if (method === "POST") {
      const saved = { ...record, id: id(200 + testimonials.length), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      testimonials.push(saved);
      return respond(saved, 201);
    }
    if (method === "PATCH") { Object.assign(target, record); return respond(target); }
    if (method === "DELETE") { testimonials.splice(testimonials.indexOf(target), 1); return respond({ id: target.id }); }
  }
  if (["feedback", "testimonials"].includes(table)) {
    let rows = table === "feedback" ? feedback.map((item) => ({ ...item, testimonials: testimonials.filter((story) => story.source_feedback_id === item.id).map(({ id, is_published }) => ({ id, is_published })) })) : [...testimonials];
    for (const field of ["subject", "rating", "is_published"]) {
      if (url.searchParams.has(field)) rows = rows.filter((item) => String(item[field]) === url.searchParams.get(field).slice(3));
    }
    const search = url.searchParams.get("or")?.match(/ilike\.%([^%]+)%/)?.[1]?.toLowerCase();
    if (search) rows = rows.filter((item) => [item.customer_name, item.message, item.email].join(" ").toLowerCase().includes(search));
    return respond(rows.slice(Number(url.searchParams.get("offset") || 0), Number(url.searchParams.get("offset") || 0) + 20), 200, rows.length);
  }
  return respond([]);
}

async function start(app, port) {
  const server = await createServer({ root: path.join(root, `apps/${app}`), server: { host: "127.0.0.1", port, strictPort: true }, logLevel: "error" });
  await server.listen();
  servers.push(server);
  return `http://127.0.0.1:${port}`;
}
async function cleanPage(page, label) {
  assert.equal(await page.locator("vite-error-overlay").count(), 0, `${label}: no Vite overlay`);
  assert.ok((await page.locator("body").innerText()).length > 100, `${label}: page is not blank`);
  assert.deepEqual(exceptions, [], `${label}: no runtime exceptions`);
}
async function show(page, locator) { await locator.waitFor({ state: "visible" }); await cleanPage(page, "view"); }

try {
  browser = await playwright.chromium.launch({ headless: true, ...(process.env.NUEDE_BROWSER_CHANNEL ? { channel: process.env.NUEDE_BROWSER_CHANNEL } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await context.route("http://127.0.0.1:54321/**", mock);
  await context.routeWebSocket("**/realtime/**", (socket) => socket.close());
  const page = await context.newPage();
  page.on("pageerror", (error) => exceptions.push(error.message));
  const storefront = await start("storefront", 5275);
  await page.goto(storefront);
  await show(page, page.getByRole("heading", { name: "Good food. Clear choices. Delivered." }));
  await show(page, page.getByRole("button", { name: "Quick add Browser test meal", exact: true }));
  await page.screenshot({ path: path.join(output, "storefront-desktop.png"), fullPage: true });
  console.log("PASS storefront dev server: content, controls, no error overlay or runtime exceptions");
  assert.equal(await page.getByRole("button", { name: "Pause automatic highlights" }).count(), 0, "reduced-motion stops rotation");
  await page.getByRole("button", { name: "Next highlight" }).click();
  await show(page, page.getByRole("heading", { name: "A little planning. A week of good food." }));
  assert.equal(await page.getByRole("region", { name: "Nuede highlights" }).getByRole("link", { name: "Build a meal plan", exact: true }).getAttribute("href"), "/planner");
  const faq = page.locator("summary").first();
  await faq.focus(); await page.keyboard.press("Enter");
  assert.equal(await faq.evaluate((element) => element.parentElement.open), true);
  await page.keyboard.press("Enter");
  assert.equal(await faq.evaluate((element) => element.parentElement.open), false);
  await page.getByRole("button", { name: "Quick add Browser test meal", exact: true }).click();
  await show(page, page.getByRole("button", { name: "Open basket, 1 item", exact: true }));
  assert.equal(await page.getByRole("button", { name: "Quick add Sold-out test meal", exact: true }).isDisabled(), true);
  await page.getByRole("button", { name: "Choose options for Grouped test meal", exact: true }).click();
  await show(page, page.getByRole("dialog"));
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await show(page, page.getByText("Enter a name.", { exact: true }));
  assert.equal(feedback.length, 0);
  await page.getByLabel("Name", { exact: false }).fill("Browser Customer");
  await page.getByLabel("Email", { exact: false }).fill("private@example.com");
  await page.getByLabel("Subject", { exact: false }).selectOption("compliment");
  await page.getByLabel("Rating", { exact: false }).selectOption("5");
  await page.getByLabel("Written feedback", { exact: false }).fill("Great meal. <script>window.feedbackXss=true</script>");
  failSubmission = true;
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Send feedback", exact: true }).isDisabled(), true);
  await show(page, page.getByRole("alert"));
  assert.equal(await page.getByLabel("Name", { exact: false }).inputValue(), "Browser Customer");
  assert.equal((await page.locator("body").innerText()).includes("private raw database failure"), false);
  failSubmission = false;
  await page.getByRole("button", { name: "Send feedback", exact: true }).click();
  await show(page, page.getByText("Thank you. Your feedback has been sent to our team.", { exact: true }));
  assert.equal(feedback.length, 1);
  assert.deepEqual(Object.keys(JSON.parse(requests.filter((request) => request.method === "POST" && request.pathname.endsWith("/feedback")).at(-1).body)).sort(), ["customer_name", "email", "message", "rating", "subject"]);
  assert.equal(requests.some((request) => request.method === "GET" && request.pathname.endsWith("/feedback")), false, "storefront never reads feedback");
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `no horizontal page overflow at ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, "storefront-mobile.png"), fullPage: true });
  console.log("PASS storefront: hero, keyboard FAQ, reduced motion, quick add, grouped details, sold-out guard, feedback validation/error/success, five viewport widths");

  const adminPage = await context.newPage();
  adminPage.on("pageerror", (error) => exceptions.push(error.message));
  const admin = await start("admin", 5274);
  await adminPage.goto(`${admin}/feedback`);
  await show(adminPage, adminPage.getByRole("button", { name: "Sign in", exact: true }));
  assert.ok(adminPage.url().includes("/login"));
  console.log("PASS admin dev server: guarded route renders sign-in, no error overlay or runtime exceptions");
  await adminPage.getByLabel("Email address", { exact: false }).fill(user.email);
  await adminPage.getByLabel("Password", { exact: false }).fill("Browser-test-only-123!");
  await adminPage.getByRole("button", { name: "Sign in", exact: true }).click();
  await show(adminPage, adminPage.getByRole("button", { name: "Read feedback", exact: true }));
  await adminPage.getByLabel("Subject", { exact: false }).selectOption("compliment");
  await adminPage.getByLabel("Rating", { exact: false }).selectOption("1");
  await show(adminPage, adminPage.getByRole("heading", { name: "No feedback matches" }));
  assert.ok(requests.some((request) => request.search.includes("subject=eq.compliment") && request.search.includes("rating=eq.1")), "combined filters sent to server");
  await adminPage.getByRole("button", { name: "Clear filters", exact: true }).first().click();
  await show(adminPage, adminPage.getByRole("button", { name: "Read feedback", exact: true }));
  await adminPage.getByRole("button", { name: "Read feedback", exact: true }).click();
  await show(adminPage, adminPage.getByRole("dialog", { name: "Compliment", exact: true }));
  assert.equal(await adminPage.evaluate(() => Boolean(window.feedbackXss)), false);
  await adminPage.getByRole("button", { name: "Create testimonial", exact: true }).click();
  const editor = adminPage.getByRole("dialog", { name: "Create testimonial from feedback", exact: true });
  await show(adminPage, editor);
  assert.equal((await editor.innerText()).includes("private@example.com"), false);
  await editor.getByLabel("Customer display name", { exact: false }).fill("Public display name");
  await editor.getByLabel("Testimonial text", { exact: false }).fill("Reviewed testimonial text");
  await editor.getByRole("button", { name: "Save unpublished draft", exact: true }).click();
  await editor.waitFor({ state: "detached" });
  assert.equal(testimonials.length, 1);
  assert.equal(testimonials[0].is_published, false);
  assert.equal(testimonials[0].email, undefined);
  assert.equal(feedback.length, 1);
  assert.ok(feedback[0].message.includes("<script>"));
  assert.equal(await adminPage.getByRole("button", { name: "Testimonial already created", exact: true }).isDisabled(), true);
  await adminPage.keyboard.press("Escape");
  assert.equal(await adminPage.getByRole("button", { name: "Read feedback", exact: true }).evaluate((element) => document.activeElement === element), true, "dialog restores focus");
  await page.reload();
  await show(page, page.getByRole("heading", { name: "Customer stories are on their way" }));
  await adminPage.goto(`${admin}/testimonials`);
  await show(adminPage, adminPage.getByRole("button", { name: "Publish", exact: true }));
  await adminPage.getByRole("button", { name: "Publish", exact: true }).click();
  failMutation = true;
  await adminPage.getByRole("button", { name: "Confirm publish", exact: true }).click();
  await show(adminPage, adminPage.getByRole("alert"));
  assert.equal(testimonials[0].is_published, false);
  failMutation = false;
  await adminPage.getByRole("button", { name: "Confirm publish", exact: true }).click();
  await adminPage.getByRole("dialog").waitFor({ state: "detached" });
  await page.reload();
  await show(page, page.getByText("Reviewed testimonial text", { exact: true }));
  assert.equal((await page.locator("body").innerText()).includes("private@example.com"), false);
  await adminPage.getByRole("button", { name: "View / edit", exact: true }).click();
  await adminPage.getByLabel("Rating", { exact: false }).last().selectOption("4");
  await adminPage.getByRole("button", { name: "Save changes", exact: true }).click();
  await adminPage.getByRole("dialog").waitFor({ state: "detached" });
  assert.equal(testimonials[0].rating, 4);
  await adminPage.getByRole("button", { name: "Unpublish", exact: true }).click();
  await adminPage.getByRole("button", { name: "Confirm unpublish", exact: true }).click();
  await adminPage.getByRole("dialog").waitFor({ state: "detached" });
  await page.reload();
  await show(page, page.getByRole("heading", { name: "Customer stories are on their way" }));
  await adminPage.screenshot({ path: path.join(output, "admin-testimonials.png"), fullPage: true });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await adminPage.setViewportSize({ width, height: 900 });
    assert.equal(await adminPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `admin has no page overflow at ${width}px`);
  }
  await adminPage.setViewportSize({ width: 390, height: 844 });
  await adminPage.getByRole("button", { name: "View / edit", exact: true }).click();
  assert.equal(await adminPage.getByRole("dialog").evaluate((element) => element.scrollWidth <= element.clientWidth), true, "mobile editor does not overflow");
  await adminPage.screenshot({ path: path.join(output, "admin-mobile-editor.png") });
  await adminPage.keyboard.press("Escape");
  await adminPage.getByRole("button", { name: "Delete", exact: true }).click();
  assert.equal(testimonials.length, 1, "delete waits for confirmation");
  await adminPage.getByRole("button", { name: "Confirm delete", exact: true }).click();
  await show(adminPage, adminPage.getByRole("heading", { name: "No testimonials yet" }));
  assert.equal(feedback.length, 1, "delete preserves source");
  console.log("PASS admin: private inbox, filters, editable draft conversion, preserved source, publication failure/retry, explicit publish/unpublish, edit rating, confirmed deletion, focus restoration");

  for (const number of [1, 2, 3]) testimonials.push({ id: id(300 + number), customer_name: `Carousel test ${number}`, message: `Published browser fixture ${number}`, rating: number + 2, is_published: true });
  await page.reload();
  await show(page, page.getByRole("region", { name: "testimonials", exact: true }));
  const track = page.getByLabel("testimonials, scroll horizontally for more", { exact: true });
  await track.focus(); await page.keyboard.press("ArrowRight");
  assert.ok(await track.evaluate((element) => element.scrollLeft > 0), "testimonial carousel scrolls with keyboard");
  assert.equal(await page.getByRole("region", { name: "testimonials", exact: true }).getByText("3 out of 5", { exact: true }).count(), 1, "numeric rating is readable without color");
  await page.screenshot({ path: path.join(output, "published-testimonials-mobile.png"), fullPage: true });
  console.log("PASS admin mobile list/editor and published testimonial keyboard carousel");

  failTestimonials = true; failMenu = true;
  await page.reload();
  await show(page, page.getByRole("heading", { name: "Testimonials are unavailable" }));
  await show(page, page.getByRole("heading", { name: "Featured meals are unavailable" }));
  failTestimonials = false; failMenu = false; emptyMenu = true;
  await page.reload();
  await show(page, page.getByRole("heading", { name: "The menu is being prepared" }));
  await cleanPage(page, "final storefront");
  await cleanPage(adminPage, "final admin");
  console.log("PASS empty/error states; browser evidence saved to coverage/cycle17. HTTP mocked: no live DB/RLS claim.");
} finally {
  await browser?.close();
  await Promise.all(servers.map((server) => server.close()));
}
