import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";

function localEnvironment() {
  const command = process.platform === "win32" ? "supabase.cmd" : "supabase";
  const result = spawnSync(command, ["status", "-o", "env"], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) throw new Error("Local Supabase is not running. Start it before the Cycle 4 catalog test.");
  const values = {};
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) values[match[1]] = match[2].replace(/^"|"$/g, "");
  }
  const url = values.API_URL;
  const anonKey = values.ANON_KEY || values.PUBLISHABLE_KEY;
  const serviceRoleKey = values.SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) throw new Error("Local Supabase credentials are incomplete.");
  if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname)) {
    throw new Error("Cycle 4 destructive catalog tests refuse to run against a non-local Supabase URL.");
  }
  return { url, anonKey, serviceRoleKey };
}

const options = { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } };
const expectSuccess = (result, label) => {
  assert.equal(result.error, null, `${label}: ${result.error?.message || "unexpected error"}`);
  return result.data;
};
const expectDenial = (result, label) => {
  assert.ok(result.error, `${label}: request unexpectedly succeeded`);
  assert.ok(["42501", "PGRST301"].includes(result.error.code), `${label}: unexpected code ${result.error.code}`);
};

const { url, anonKey, serviceRoleKey } = localEnvironment();
const service = createClient(url, serviceRoleKey, options);
const anonymous = createClient(url, anonKey, options);
const suffix = randomUUID();
const email = `cycle4-${suffix}@example.com`;
const password = `Cycle4-${randomUUID()}-Aa1!`;
let userId;
let categoryId;
let productId;

try {
  const { data: created, error: userError } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (userError) throw userError;
  userId = created.user.id;
  expectSuccess(await service.from("admin_users").insert({ id: userId, email, display_name: "Cycle 4 Test", role: "admin", is_active: true }), "create active admin");

  const admin = createClient(url, anonKey, options);
  const { error: signInError } = await admin.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  expectDenial(await anonymous.from("products").insert({}), "anonymous product creation");

  const category = expectSuccess(await admin.from("categories").insert({
    name: `Cycle 4 ${suffix}`,
    slug: `cycle-4-${suffix}`,
    is_enabled: true,
    sort_order: 900,
  }).select("id,name,is_enabled,sort_order").single(), "create category");
  categoryId = category.id;
  assert.equal(expectSuccess(await service.from("categories").select("id").eq("id", categoryId).single(), "verify category in PostgreSQL").id, categoryId);
  expectSuccess(await admin.from("categories").update({ name: `Cycle 4 Renamed ${suffix}`, slug: `cycle-4-renamed-${suffix}`, sort_order: 910 }).eq("id", categoryId), "rename and reorder category");
  expectSuccess(await admin.from("categories").update({ is_enabled: false }).eq("id", categoryId), "disable category");
  expectSuccess(await admin.from("categories").update({ is_enabled: true }).eq("id", categoryId), "enable category");

  const product = expectSuccess(await admin.from("products").insert({
    category_id: categoryId,
    product_type: "standard",
    name: `Cycle 4 Meal ${suffix}`,
    slug: `cycle-4-meal-${suffix}`,
    description: "Initial Cycle 4 meal",
    price_kobo: 650000,
    calories: 600,
    protein_g: 45,
    carbohydrates_g: 60,
    fat_g: 20,
    status: "available",
  }).select("id,price_kobo,status").single(), "create standard product");
  productId = product.id;
  assert.equal(product.price_kobo, 650000);

  const edited = expectSuccess(await admin.from("products").update({ description: "Edited Cycle 4 meal", price_kobo: 700000 }).eq("id", productId).select("description,price_kobo").single(), "edit standard product");
  assert.equal(edited.price_kobo, 700000);
  assert.equal(expectSuccess(await service.from("products").select("price_kobo").eq("id", productId).single(), "verify integer kobo in PostgreSQL").price_kobo, 700000);

  assert.equal(expectSuccess(await admin.from("products").select("id").ilike("name", "%Cycle 4 Meal%").eq("id", productId), "search product").length, 1);
  assert.equal(expectSuccess(await admin.from("products").select("id").eq("category_id", categoryId).eq("id", productId), "filter category").length, 1);
  assert.equal(expectSuccess(await admin.from("products").select("id").eq("status", "available").eq("id", productId), "filter status").length, 1);

  for (const status of ["sold_out", "available", "hidden", "available", "archived", "hidden"]) {
    const changed = expectSuccess(await admin.from("products").update({ status }).eq("id", productId).select("status").single(), `set ${status}`);
    assert.equal(changed.status, status);
  }

  const invalid = await admin.from("products").update({ price_kobo: -1 }).eq("id", productId);
  assert.equal(invalid.error?.code, "23514", "negative prices are rejected by PostgreSQL");

  const audits = expectSuccess(await admin.from("admin_audit_log").select("action").eq("entity_id", productId), "read product audit events").map((row) => row.action);
  for (const action of ["product_created", "product_price_changed", "product_archived", "product_restored"]) {
    assert.ok(audits.includes(action), `${action} audit event exists`);
  }

  console.log("Cycle 4 direct category, product, status, audit, integer-kobo, and RLS checks passed.");
} finally {
  if (productId) {
    await service.from("admin_audit_log").delete().eq("entity_id", productId);
    await service.from("products").delete().eq("id", productId);
  }
  if (categoryId) await service.from("categories").delete().eq("id", categoryId);
  if (userId) await service.auth.admin.deleteUser(userId);
}
