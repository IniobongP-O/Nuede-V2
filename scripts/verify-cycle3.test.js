import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = "supabase/migrations/20260831000200_enable_auth_and_rls.sql";

async function read(relativePath) {
  return readFile(path.join(repositoryRoot, relativePath), "utf8");
}

test("Cycle 3 enables RLS on every Cycle 2 business table", async () => {
  const migration = await read(migrationPath);
  const tables = [
    "categories",
    "products",
    "product_variants",
    "product_addons",
    "product_addon_assignments",
    "delivery_zones",
    "admin_users",
    "checkout_settings",
    "orders",
    "order_items",
    "order_item_addons",
    "payments",
    "feedback",
    "testimonials",
    "admin_audit_log",
  ];

  for (const table of tables) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
});

test("Cycle 3 preserves the approved public and trusted-commerce boundaries", async () => {
  const migration = await read(migrationPath);

  assert.match(migration, /products_public_select[\s\S]*status not in \('hidden', 'archived'\)/);
  assert.match(migration, /feedback_public_insert[\s\S]*to anon[\s\S]*with check \(true\)/);
  assert.doesNotMatch(migration, /grant insert[^;]*public\.orders[^;]*to (anon|authenticated)/is);
  assert.doesNotMatch(migration, /grant update[^;]*public\.payments[^;]*to (anon|authenticated)/is);
  assert.doesNotMatch(migration, /grant update[^;]*public\.checkout_settings[^;]*to (anon|authenticated)/is);
  assert.match(migration, /create view public\.checkout_payment_options/);
  assert.match(migration, /select paystack_enabled, whatsapp_enabled/);
});

test("Cycle 3 authorization helper has the reviewed security-definer shape", async () => {
  const migration = await read(migrationPath);

  assert.match(migration, /create or replace function private\.is_active_admin\(\)/);
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = ''/);
  assert.match(migration, /admin_user\.id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /admin_user\.is_active/);
  assert.match(migration, /admin_user\.role in \('owner', 'admin', 'editor'\)/);
  assert.match(migration, /revoke all on function private\.is_active_admin\(\) from public, anon, authenticated/);
});

test("Admin application uses one browser-safe Supabase client and real protected routes", async () => {
  const client = await read("apps/admin/src/lib/supabaseClient.js");
  const router = await read("apps/admin/src/app/router.jsx");
  const app = await read("apps/admin/src/App.jsx");
  const login = await read("apps/admin/src/pages/LoginPage.jsx");

  assert.match(client, /VITE_SUPABASE_URL/);
  assert.match(client, /VITE_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(client, /SERVICE_ROLE/i);
  assert.match(app, /AuthProvider/);
  assert.match(router, /ProtectedRoute/);
  assert.match(router, /PublicOnlyRoute/);
  assert.match(login, /signIn/);
  assert.doesNotMatch(login, /signUp|create account|forgot.password/i);
});

test("No browser source contains backend credentials or custom token persistence", async () => {
  const files = [
    "apps/admin/.env.example",
    "apps/admin/src/lib/supabaseClient.js",
    "apps/admin/src/features/auth/api/authApi.js",
    "apps/admin/src/features/auth/context/AuthContext.jsx",
    "apps/storefront/src/App.jsx",
  ];

  for (const file of files) {
    const source = await read(file);
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.doesNotMatch(source, /localStorage\.setItem/);
  }
});

test("Local Auth configuration disables public registration", async () => {
  const config = await read("supabase/config.toml");
  const signupSettings = [...config.matchAll(/^enable_signup = (true|false)$/gm)].map((match) => match[1]);

  assert.deepEqual(signupSettings, ["false", "false", "false"]);
});
