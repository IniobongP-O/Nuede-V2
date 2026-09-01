import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";

function localEnvironment() {
  const command = process.platform === "win32" ? "supabase.cmd" : "supabase";
  const result = spawnSync(command, ["status", "-o", "env"], {
    cwd: process.cwd(), encoding: "utf8", shell: process.platform === "win32",
  });
  if (result.status !== 0) throw new Error("Local Supabase is not running. Start it before the Cycle 5 catalog test.");
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
    throw new Error("Cycle 5 destructive catalog tests refuse to run against a non-local Supabase URL.");
  }
  return { url, anonKey, serviceRoleKey };
}

const options = { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } };
const expectSuccess = (result, label) => {
  assert.equal(result.error, null, `${label}: ${result.error?.message || "unexpected error"}`);
  return result.data;
};
const expectError = (result, label) => assert.ok(result.error, `${label}: request unexpectedly succeeded`);

const { url, anonKey, serviceRoleKey } = localEnvironment();
const service = createClient(url, serviceRoleKey, options);
const anonymous = createClient(url, anonKey, options);
const suffix = randomUUID();
const email = `cycle5-${suffix}@example.com`;
const password = `Cycle5-${randomUUID()}-Aa1!`;
let imagePath;
let replacementImagePath;
let userId;
let categoryId;
let groupId;
let standardId;
let variantAId;
let variantBId;
let addonId;

try {
  const { data: created, error: userError } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (userError) throw userError;
  userId = created.user.id;
  expectSuccess(await service.from("admin_users").insert({ id: userId, email, display_name: "Cycle 5 Test", role: "admin", is_active: true }), "create active admin");

  const admin = createClient(url, anonKey, options);
  const { error: signInError } = await admin.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  expectError(await anonymous.from("products").insert({}), "anonymous grouped-product creation");
  expectError(await anonymous.from("product_variants").insert({}), "anonymous variant creation");
  expectError(await anonymous.from("product_addons").insert({}), "anonymous add-on creation");

  const category = expectSuccess(await admin.from("categories").insert({
    name: `Cycle 5 ${suffix}`, slug: `cycle-5-${suffix}`, is_enabled: true, sort_order: 950,
  }).select("id").single(), "create category");
  categoryId = category.id;

  const group = expectSuccess(await admin.from("products").insert({
    category_id: categoryId,
    product_type: "grouped",
    name: `Cycle 5 Group ${suffix}`,
    slug: `cycle-5-group-${suffix}`,
    description: "Cycle 5 grouped lifecycle test",
    status: "hidden",
    requires_variant_selection: true,
  }).select("id,status").single(), "create grouped parent");
  groupId = group.id;
  const noVariantAvailable = await admin.from("products").update({ status: "available" }).eq("id", groupId);
  expectError(noVariantAvailable, "group with zero variants becoming available");
  assert.equal(noVariantAvailable.error.code, "23514");

  const variantA = expectSuccess(await admin.from("product_variants").insert({
    product_id: groupId, name: "Cycle 5 Variant A", price_kobo: 650000,
    calories: 500, protein_g: 40, carbohydrates_g: 55, fat_g: 12, status: "available", sort_order: 20,
  }).select("id,price_kobo,status,sort_order").single(), "create available variant");
  variantAId = variantA.id;
  const variantB = expectSuccess(await admin.from("product_variants").insert({
    product_id: groupId, name: "Cycle 5 Variant B", price_kobo: 700000,
    calories: 560, protein_g: 38, carbohydrates_g: 68, fat_g: 14, status: "sold_out", sort_order: 10,
  }).select("id,price_kobo,status,sort_order").single(), "create independent sold-out variant");
  variantBId = variantB.id;

  const editedA = expectSuccess(await admin.from("product_variants").update({ price_kobo: 675000, protein_g: 42 })
    .eq("id", variantAId).select("id,price_kobo,protein_g").single(), "edit variant");
  assert.equal(editedA.id, variantAId, "variant edit preserves stable ID");
  assert.equal(editedA.price_kobo, 675000, "variant price remains integer kobo");
  assert.equal(variantB.status, "sold_out", "variant sold-out state remains independent");

  expectSuccess(await admin.rpc("reorder_product_variants", {
    p_product_id: groupId, p_variant_ids: [variantAId, variantBId],
  }), "reorder variants atomically");
  const reordered = expectSuccess(await service.from("product_variants").select("id,sort_order")
    .eq("product_id", groupId).order("sort_order"), "inspect variant order");
  assert.deepEqual(reordered.map((item) => item.id), [variantAId, variantBId]);

  expectSuccess(await admin.from("products").update({ status: "available" }).eq("id", groupId), "make valid group available");
  expectSuccess(await admin.from("products").update({ requires_variant_selection: false, default_variant_id: variantAId })
    .eq("id", groupId), "configure valid default variant");
  const invalidateDefault = await admin.from("product_variants").update({ status: "sold_out" }).eq("id", variantAId);
  expectError(invalidateDefault, "invalidate configured default variant");
  assert.equal(invalidateDefault.error.code, "23514");

  const addon = expectSuccess(await admin.from("product_addons").insert({
    name: `Cycle 5 Add-on ${suffix}`, price_kobo: 125000, calories: 90,
    protein_g: 18, carbohydrates_g: 2, fat_g: 1, is_available: true,
  }).select("id,price_kobo,is_available").single(), "create add-on");
  addonId = addon.id;
  const updatedAddon = expectSuccess(await admin.from("product_addons").update({ price_kobo: 135000, is_available: false })
    .eq("id", addonId).select("id,price_kobo,is_available").single(), "edit add-on availability and price");
  assert.equal(updatedAddon.id, addonId, "add-on edit preserves stable ID");
  assert.equal(updatedAddon.price_kobo, 135000, "add-on price remains integer kobo");
  assert.equal(updatedAddon.is_available, false);
  expectSuccess(await admin.rpc("replace_product_addon_assignments", {
    p_product_id: groupId, p_addon_ids: [addonId],
  }), "assign shared group add-on");
  const invalidAssignment = await admin.rpc("replace_product_addon_assignments", {
    p_product_id: groupId, p_addon_ids: [randomUUID()],
  });
  expectError(invalidAssignment, "reject nonexistent add-on relationship");
  assert.equal(invalidAssignment.error.code, "23514");

  const standard = expectSuccess(await admin.from("products").insert({
    category_id: categoryId, product_type: "standard", name: `Cycle 5 Standard ${suffix}`,
    slug: `cycle-5-standard-${suffix}`, price_kobo: 500000, status: "available",
  }).select("id").single(), "create standard meal");
  standardId = standard.id;
  expectSuccess(await admin.rpc("replace_product_addon_assignments", {
    p_product_id: standardId, p_addon_ids: [addonId],
  }), "assign compatible add-on to standard meal");

  imagePath = `products/${standardId}/${randomUUID()}.webp`;
  replacementImagePath = `products/${standardId}/${randomUUID()}.webp`;
  const imageBody = new Blob([new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80])], { type: "image/webp" });
  expectError(await anonymous.storage.from("product-images").upload(imagePath, imageBody, { contentType: "image/webp" }), "anonymous image upload");
  expectSuccess(await admin.storage.from("product-images").upload(imagePath, imageBody, { contentType: "image/webp" }), "active-admin image upload");
  expectSuccess(await admin.from("products").update({ image_path: imagePath }).eq("id", standardId), "persist first image reference");
  expectSuccess(await admin.storage.from("product-images").upload(replacementImagePath, imageBody, { contentType: "image/webp" }), "upload replacement before deleting old image");
  expectSuccess(await admin.from("products").update({ image_path: replacementImagePath }).eq("id", standardId), "persist replacement image reference");
  expectError(await anonymous.storage.from("product-images").remove([imagePath]), "anonymous image delete");
  expectSuccess(await admin.storage.from("product-images").remove([imagePath]), "clean old image after replacement persisted");
  const persistedImage = expectSuccess(await service.from("products").select("image_path").eq("id", standardId).single(), "inspect replacement image reference");
  assert.equal(persistedImage.image_path, replacementImagePath);
  expectError(await anonymous.storage.from("product-images").remove([replacementImagePath]), "anonymous replacement delete");
  expectSuccess(await admin.storage.from("product-images").remove([replacementImagePath]), "active-admin replacement delete");

  const auditRows = expectSuccess(await service.from("admin_audit_log").select("action")
    .eq("admin_user_id", userId), "inspect Cycle 5 audit events");
  const actions = new Set(auditRows.map((row) => row.action));
  for (const action of ["grouped_product_created", "variant_created", "variant_price_changed", "addon_created", "addon_updated", "addon_assigned"]) {
    assert.ok(actions.has(action), `missing audit action ${action}`);
  }

  console.log("Cycle 5 local catalog, grouped validation, add-on, audit, RLS, and Storage checks passed.");
} finally {
  const cleanupPaths = [imagePath, replacementImagePath].filter(Boolean);
  if (cleanupPaths.length) await service.storage.from("product-images").remove(cleanupPaths);
  if (groupId) {
    await service.from("products").update({ status: "hidden", requires_variant_selection: true, default_variant_id: null }).eq("id", groupId);
  }
  if (standardId) await service.from("products").delete().eq("id", standardId);
  if (groupId) await service.from("products").delete().eq("id", groupId);
  if (addonId) await service.from("product_addons").delete().eq("id", addonId);
  if (categoryId) await service.from("categories").delete().eq("id", categoryId);
  if (userId) {
    await service.from("admin_audit_log").delete().eq("admin_user_id", userId);
    await service.from("admin_users").delete().eq("id", userId);
    await service.auth.admin.deleteUser(userId);
  }
}
