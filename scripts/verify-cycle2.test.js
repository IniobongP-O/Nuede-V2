import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = "supabase/migrations/20260831000100_create_database_foundation.sql";

async function read(relativePath) {
  return readFile(path.join(repositoryRoot, relativePath), "utf8");
}

test("Cycle 2 migration declares every required table and the approved junction", async () => {
  const migration = await read(migrationPath);
  const tables = [
    "categories",
    "products",
    "product_variants",
    "product_addons",
    "product_addon_assignments",
    "delivery_zones",
    "checkout_settings",
    "admin_users",
    "orders",
    "order_items",
    "order_item_addons",
    "payments",
    "testimonials",
    "feedback",
    "admin_audit_log",
  ];

  for (const table of tables) {
    assert.match(migration, new RegExp(`create table public\\.${table} \\(`));
  }
});

test("Cycle 2 migration preserves core money, history, and status contracts", async () => {
  const migration = await read(migrationPath);

  for (const moneyColumn of [
    "price_kobo bigint",
    "fee_kobo bigint",
    "subtotal_kobo bigint",
    "delivery_fee_kobo bigint",
    "total_kobo bigint",
    "amount_kobo bigint",
  ]) {
    assert.match(migration, new RegExp(moneyColumn));
  }

  assert.match(migration, /payment_status text not null/);
  assert.match(migration, /fulfilment_status text not null/);
  assert.match(migration, /product_name text not null/);
  assert.match(migration, /addon_name text not null/);
  assert.match(migration, /checkout_settings_payment_method_required/);
  assert.match(migration, /foreign key \(id\) references auth\.users\(id\)/);
});

test("Cycle 2 remains outside the RLS, Edge Function, and frontend integration cycles", async () => {
  const migration = (await read(migrationPath)).toLowerCase();
  const storefrontApp = await read("apps/storefront/src/App.jsx");
  const adminApp = await read("apps/admin/src/App.jsx");
  const functionsReadme = await read("supabase/functions/README.md");

  assert.doesNotMatch(migration, /create\s+policy/);
  assert.doesNotMatch(migration, /enable\s+row\s+level\s+security/);
  assert.doesNotMatch(storefrontApp, /supabase/i);
  assert.doesNotMatch(adminApp, /supabase/i);
  assert.match(functionsReadme, /No Edge Function is implemented/);
});

test("Cycle 2 local tooling is reproducible and project-scoped", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  const config = await read("supabase/config.toml");
  const seed = await read("supabase/seed.sql");

  assert.match(packageJson.devDependencies.supabase, /^\d+\.\d+\.\d+$/);
  assert.equal(packageJson.scripts["db:reset"], "supabase db reset --local");
  assert.equal(packageJson.scripts["db:test"], "supabase test db --local");
  assert.match(config, /\[db\.migrations\]/);
  assert.match(config, /sql_paths = \["\.\/seed\.sql"\]/);
  assert.match(seed, /10000000-0000-4000-8000-000000000001/);
  assert.doesNotMatch(seed, /insert into auth\.users/i);
});
