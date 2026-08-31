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

test("Cycle 1 application source contains no future-cycle integrations", async () => {
  const files = [
    ...(await walk("apps/storefront/src")),
    ...(await walk("apps/admin/src")),
  ].filter((file) => /\.jsx?$/.test(file));

  const forbiddenPatterns = [
    /from\s+["']@supabase\//,
    /supabase\.from\s*\(/,
    /\blocalStorage\b/,
    /from\s+["']firebase/,
    /PaystackPop|window\.Paystack|initializeTransaction/,
  ];

  for (const file of files) {
    const source = await readFile(path.join(repositoryRoot, file), "utf8");
    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(source, pattern, `${file} contains future-cycle behavior`);
    }
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
  assert.deepEqual(sharedFiles, []);
});

test("shared config exports brand tokens without React", async () => {
  const packageJson = JSON.parse(await readFile(path.join(repositoryRoot, "packages/config/package.json"), "utf8"));
  const brandCss = await readFile(path.join(repositoryRoot, "packages/config/src/brand.css"), "utf8");
  assert.equal(packageJson.exports["./brand.css"], "./src/brand.css");
  assert.match(brandCss, /--color-brand-950/);
  assert.doesNotMatch(brandCss, /react/i);
});
