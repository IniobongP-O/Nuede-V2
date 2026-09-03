import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { adminRouteList } from "../apps/admin/src/app/routePaths.js";
import { storefrontRouteList } from "../apps/storefront/src/app/routePaths.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function walk(relativeDirectory) {
  const entries = await readdir(path.join(repositoryRoot, relativeDirectory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(relativePath)));
    else files.push(relativePath);
  }
  return files;
}

test("Cycle 1 storefront routes are declared exactly", () => {
  assert.deepEqual([...storefrontRouteList].sort(), ["/", "/checkout", "/menu", "/payment", "/planner", "/saved"]);
});

test("Cycle 1 admin routes are declared exactly", () => {
  assert.deepEqual([...adminRouteList].sort(), ["/analytics", "/dashboard", "/delivery", "/feedback", "/login", "/menu", "/orders", "/settings", "/testimonials"]);
});

test("applications do not import one another", async () => {
  const storefrontFiles = (await walk("apps/storefront/src")).filter((file) => /\.jsx?$/.test(file));
  const adminFiles = (await walk("apps/admin/src")).filter((file) => /\.jsx?$/.test(file));

  for (const file of storefrontFiles) {
    const source = await readFile(path.join(repositoryRoot, file), "utf8");
    assert.doesNotMatch(source, /@nuede\/admin|apps[\\/]admin/, `${file} imports admin code`);
  }

  for (const file of adminFiles) {
    const source = await readFile(path.join(repositoryRoot, file), "utf8");
    assert.doesNotMatch(source, /@nuede\/storefront|apps[\\/]storefront/, `${file} imports storefront code`);
  }
});

test("application source stays outside unapproved future integration boundaries", async () => {
  const storefrontFiles = (await walk("apps/storefront/src")).filter((file) => /\.jsx?$/.test(file));
  const savedMealsStorage = path.normalize("apps/storefront/src/features/saved-meals/storage/savedMealsStorage.js");
  const cartStorage = path.normalize("apps/storefront/src/features/cart/storage/cartStorage.js");
  const plannerStorage = path.normalize("apps/storefront/src/features/planner/storage/plannerStorage.js");
  const approvedStorageFiles = new Set([savedMealsStorage, cartStorage, plannerStorage]);
  const storefrontForbiddenPatterns = [
    /from\s+["']firebase/,
    /PaystackPop|window\.Paystack|initializeTransaction/,
  ];

  for (const file of storefrontFiles) {
    const source = await readFile(path.join(repositoryRoot, file), "utf8");
    if (!approvedStorageFiles.has(path.normalize(file))) {
      assert.doesNotMatch(source, /\blocalStorage\b/, `${file} bypasses centralized browser persistence`);
    }
    for (const pattern of storefrontForbiddenPatterns) {
      assert.doesNotMatch(source, pattern, `${file} contains an unapproved storefront integration`);
    }
  }

  const adminFiles = (await walk("apps/admin/src")).filter((file) => /\.jsx?$/.test(file));
  for (const file of adminFiles) {
    const source = await readFile(path.join(repositoryRoot, file), "utf8");
    assert.doesNotMatch(source, /from\s+\(["'](?:products|orders|payments|checkout_settings)["']\)/, `${file} starts Cycle 4+ data behavior`);
    assert.doesNotMatch(source, /from\s+["']firebase|PaystackPop|window\.Paystack|initializeTransaction/, `${file} contains an unapproved backend integration`);
    assert.doesNotMatch(source, /\blocalStorage\b/, `${file} implements custom browser persistence`);
  }
});

test("mock content remains application-owned fixtures", async () => {
  const storefrontFixture = await readFile(path.join(repositoryRoot, "apps/storefront/src/fixtures/storefrontFixtures.js"), "utf8");
  const adminFixture = await readFile(path.join(repositoryRoot, "apps/admin/src/fixtures/adminFixtures.js"), "utf8");
  const sharedFiles = [
    ...(await walk("packages/domain")),
    ...(await walk("packages/validation")),
    ...(await walk("packages/config")),
  ].filter((file) => /\.jsx?$/.test(file));

  assert.match(storefrontFixture, /demoMeals/);
  assert.match(adminFixture, /demoMetrics/);
  assert.deepEqual(sharedFiles.map((file) => file.replaceAll("\\", "/")).sort(), [
    "packages/domain/src/cart.js",
    "packages/domain/src/catalog.js",
    "packages/domain/src/currency.js",
    "packages/domain/src/nutrition.js",
    "packages/domain/src/orders.js",
    "packages/validation/src/cart.js",
    "packages/validation/src/catalog.js",
    "packages/validation/src/checkout.js",
    "packages/validation/src/customization.js",
    "packages/validation/src/planner.js",
    "packages/validation/src/savedMeals.js",
  ]);
  for (const file of sharedFiles) {
    const source = await readFile(path.join(repositoryRoot, file), "utf8");
    assert.doesNotMatch(source, /fixtures|demoMeals|demoAdminMeals/, `${file} contains application fixture content`);
  }
});

test("shared config exports brand tokens without React", async () => {
  const packageJson = JSON.parse(await readFile(path.join(repositoryRoot, "packages/config/package.json"), "utf8"));
  const brandCss = await readFile(path.join(repositoryRoot, "packages/config/src/brand.css"), "utf8");
  assert.equal(packageJson.exports["./brand.css"], "./src/brand.css");
  assert.match(brandCss, /--color-brand-950/);
  assert.doesNotMatch(brandCss, /react/i);
});
