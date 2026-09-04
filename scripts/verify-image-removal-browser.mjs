// Local UI + API-adapter integration with mocked Auth, database and Storage.
/* global document */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";
import { category, meal, grouped, variant, addons, user, token } from "./cycle18-browser-fixtures.mjs";

process.env.VITE_SUPABASE_URL = "http://127.0.0.1:54321";
process.env.VITE_SUPABASE_ANON_KEY = "cycle18-browser-public-fixture";
const originalPath = (id) => `products/${id}/10000000-0000-4000-8000-000000000001.webp`;
const products = structuredClone([{ ...meal, image_path: originalPath(meal.id) }, { ...grouped, image_path: originalPath(grouped.id), product_variants: [{ ...variant, image_path: `variants/${variant.id}/10000000-0000-4000-8000-000000000001.webp` }] }]);
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1sAAAAASUVORK5CYII=", "base64");
const deletions = [];
const errors = [];
let failSave = false;
const server = await createServer({ root: path.resolve("apps/admin"), server: { host: "127.0.0.1", port: 5574, strictPort: true }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch({ headless: true, channel: process.env.NUEDE_BROWSER_CHANNEL || "msedge" });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await context.route("http://127.0.0.1:54321/**", async (route) => {
    try {
      const request = route.request(); const url = new URL(request.url()); const table = url.pathname.split("/").at(-1);
      const respond = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
      if (url.pathname.startsWith("/storage/")) {
        if (request.method() === "GET") return route.fulfill({ contentType: "image/png", body: png });
        assert.equal(request.method(), "DELETE");
        const paths = request.postDataJSON().prefixes;
        for (const deleted of paths) {
          assert.ok(!products.flatMap((product) => [product.image_path, ...product.product_variants.map((v) => v.image_path)]).includes(deleted), "clear the database reference before Storage cleanup");
          deletions.push(deleted);
        }
        return respond([]);
      }
      if (table === "token") return respond({ access_token: token, refresh_token: "qa-refresh", token_type: "bearer", expires_in: 3600, user });
      if (table === "user") return respond(user);
      if (table === "admin_users") return respond({ ...user, role: "admin", is_active: true });
      if (table === "categories") return respond([category]);
      if (table === "product_addons") return respond(addons);
      if (table === "replace_product_addon_assignments") return respond(null);
      if (table === "products" || table === "product_variants") {
        const records = table === "products" ? products : products.flatMap((p) => p.product_variants);
        const record = records.find((p) => `eq.${p.id}` === url.searchParams.get("id"));
        if (request.method() === "PATCH") {
          if (failSave) return respond({ message: "Simulated save failure" }, 500);
          Object.assign(record, request.postDataJSON());
          return respond(url.searchParams.get("select") === "id" ? { id: record.id } : record);
        }
        if (url.searchParams.has("slug")) return respond([]);
        return respond(record || records);
      }
      throw new Error(`Unexpected ${request.method()} ${url.pathname}`);
    } catch (error) { errors.push(error.message); await route.fulfill({ status: 500, body: "Fixture failure" }); }
  });
  const page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message));
  page.setDefaultTimeout(10000);
  await page.goto("http://127.0.0.1:5574/menu");
  await page.getByLabel("Email address", { exact: false }).fill(user.email);
  await page.getByLabel("Password", { exact: false }).fill("QA-browser-only-123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const openStandard = () => page.getByRole("button", { name: "Edit", exact: true }).filter({ visible: true }).first().click();
  await openStandard();
  await page.getByRole("button", { name: "Remove image", exact: true }).click();
  await page.getByText("The image will be removed when you save.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(products[0].image_path, originalPath(meal.id)); assert.equal(deletions.length, 0);
  await openStandard();
  await page.getByLabel("Meal image", { exact: true }).setInputFiles({ name: "new.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "Remove image", exact: true }).click();
  await page.getByRole("button", { name: "Undo removal", exact: true }).click();
  await page.getByRole("img", { name: "Meal image preview", exact: true }).waitFor();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(deletions.length, 0); assert.equal(products[0].image_path, originalPath(meal.id));
  await openStandard(); await page.getByRole("button", { name: "Remove image", exact: true }).click();
  failSave = true;
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("dialog").getByRole("alert").waitFor();
  assert.equal(deletions.length, 0); assert.equal(products[0].image_path, originalPath(meal.id));
  failSave = false;
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(products[0].image_path, null); assert.equal(deletions.length, 1);

  await page.getByRole("button", { name: "Manage", exact: true }).filter({ visible: true }).click();
  await page.getByRole("button", { name: "Remove image", exact: true }).click();
  await page.getByRole("button", { name: "Save group settings", exact: true }).click();
  await page.getByText("No image selected", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Save group settings", exact: true }).waitFor();
  await page.waitForFunction(() => !document.querySelector('button[aria-busy="true"]'));
  assert.equal(products[1].image_path, null); assert.equal(deletions.length, 2);
  await page.getByRole("dialog").getByRole("button", { name: "Edit", exact: true }).click();
  const variantDialog = page.getByRole("dialog", { name: "Edit variant", exact: true });
  await variantDialog.getByRole("button", { name: "Remove image", exact: true }).click();
  await variantDialog.getByRole("button", { name: "Save variant", exact: true }).click();
  await variantDialog.waitFor({ state: "hidden" });
  assert.equal(products[1].product_variants[0].image_path, null); assert.equal(deletions.length, 3);
  await page.reload(); await page.getByRole("button", { name: "Manage", exact: true }).filter({ visible: true }).click();
  assert.equal(await page.getByRole("button", { name: "Remove image", exact: true }).count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await mkdir("coverage/image-removal", { recursive: true });
  await page.screenshot({ path: "coverage/image-removal/group-without-image.png" });
  assert.deepEqual(errors, []);
  await writeFile("coverage/image-removal/report.json", JSON.stringify({ scope: "mocked browser/API/Storage integration", cancellation: "PASS", undo: "PASS", pendingFileRemoval: "PASS", failedSaveRetainsImage: "PASS", standard: "PASS", grouped: "PASS", variant: "PASS", cleanupAfterReferenceChange: "PASS", reload: "PASS" }, null, 2));
  console.log("PASS image removal: standard/grouped/variant, cancel, undo, pending file, failed-save retry, safe cleanup and reload");
} finally { await browser.close(); await server.close(); }
