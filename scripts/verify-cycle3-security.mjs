import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";

function readLocalSupabaseEnvironment() {
  const command = process.platform === "win32" ? "supabase.cmd" : "supabase";
  const result = spawnSync(command, ["status", "-o", "env"], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error("Local Supabase is not running. Start it before the Cycle 3 security test.");
  }

  const values = {};
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^"|"$/g, "");
  }

  const url = values.API_URL;
  const anonKey = values.ANON_KEY || values.PUBLISHABLE_KEY;
  const serviceRoleKey = values.SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("The local Supabase CLI did not return the required API credentials.");
  }

  const parsedUrl = new URL(url);
  if (!["127.0.0.1", "localhost"].includes(parsedUrl.hostname)) {
    throw new Error("Cycle 3 destructive security tests refuse to run against a non-local Supabase URL.");
  }

  return { url, anonKey, serviceRoleKey };
}

function clientOptions(extraAuth = {}) {
  return {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
      ...extraAuth,
    },
  };
}

function expectSuccess(result, label) {
  assert.equal(result.error, null, `${label}: ${result.error?.message || "unexpected error"}`);
  return result.data;
}

function expectDatabaseDenial(result, label) {
  assert.ok(result.error, `${label}: request unexpectedly succeeded`);
  assert.ok(
    ["42501", "PGRST301"].includes(result.error.code),
    `${label}: expected a database authorization denial, received ${result.error.code}`,
  );
}

async function createTestUser(serviceClient, label, suffix, password) {
  const email = `cycle3-${label}-${suffix}@example.com`;
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw error;
  return { id: data.user.id, email };
}

async function signIn(url, anonKey, email, password, options = clientOptions()) {
  const client = createClient(url, anonKey, options);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

const { url, anonKey, serviceRoleKey } = readLocalSupabaseEnvironment();
const serviceClient = createClient(url, serviceRoleKey, clientOptions());
const anonClient = createClient(url, anonKey, clientOptions());
const suffix = randomUUID();
const password = `Cycle3-${randomUUID()}-Aa1!`;
const createdUsers = [];
const feedbackEmail = `cycle3-feedback-${suffix}@example.com`;
let testOrderId;
let testCategoryId;

try {
  const nonAdmin = await createTestUser(serviceClient, "non-admin", suffix, password);
  const inactiveAdmin = await createTestUser(serviceClient, "inactive", suffix, password);
  const owner = await createTestUser(serviceClient, "owner", suffix, password);
  const admin = await createTestUser(serviceClient, "admin", suffix, password);
  const editor = await createTestUser(serviceClient, "editor", suffix, password);
  createdUsers.push(nonAdmin, inactiveAdmin, owner, admin, editor);

  expectSuccess(await serviceClient.from("admin_users").insert([
    { id: inactiveAdmin.id, email: inactiveAdmin.email, display_name: "Inactive Test", role: "admin", is_active: false },
    { id: owner.id, email: owner.email, display_name: "Owner Test", role: "owner", is_active: true },
    { id: admin.id, email: admin.email, display_name: "Admin Test", role: "admin", is_active: true },
    { id: editor.id, email: editor.email, display_name: "Editor Test", role: "editor", is_active: true },
  ]), "create trusted admin profiles");

  const order = expectSuccess(await serviceClient.from("orders").insert({
    order_reference: `CYCLE3-${suffix}`,
    order_type: "cart",
    customer_name: "Security Test Customer",
    customer_phone: "+2348000000000",
    delivery_address: "Local test address",
    delivery_zone_name: "Local test zone",
    payment_method: "whatsapp",
    payment_status: "unpaid",
    fulfilment_status: "pending",
    subtotal_kobo: 10000,
    delivery_fee_kobo: 0,
    total_kobo: 10000,
    nutrition_completeness: "unavailable",
  }).select("id").single(), "create trusted test order");
  testOrderId = order.id;

  expectSuccess(await serviceClient.from("payments").insert({
    order_id: testOrderId,
    payment_method: "whatsapp",
    amount_kobo: 10000,
    status: "unpaid",
    verification_status: "not_applicable",
  }), "create trusted test payment");

  assert.equal(expectSuccess(await anonClient.from("products").select("id"), "anonymous visible-product read").length, 7);
  assert.equal(expectSuccess(await anonClient.from("products").select("id").eq("id", "20000000-0000-4000-8000-000000000004"), "anonymous hidden-product query").length, 0);
  assert.equal(expectSuccess(await anonClient.from("product_variants").select("id"), "anonymous visible-variant read").length, 2);
  assert.equal(expectSuccess(await anonClient.from("delivery_zones").select("id"), "anonymous active-zone read").length, 6);
  assert.equal(expectSuccess(await anonClient.from("published_testimonials").select("id"), "anonymous published-testimonial read").length, 2);

  const publicCheckout = expectSuccess(await anonClient.from("checkout_payment_options").select("*").single(), "public checkout contract");
  assert.deepEqual(Object.keys(publicCheckout).sort(), ["paystack_enabled", "whatsapp_enabled"]);
  expectDatabaseDenial(await anonClient.from("checkout_settings").select("*"), "anonymous checkout metadata read");

  expectSuccess(await anonClient.from("feedback").insert({
    customer_name: "Security Test",
    email: feedbackEmail,
    subject: "general_inquiry",
    rating: 5,
    message: "Anonymous insert should succeed while reads remain private.",
  }), "anonymous feedback insert");
  expectDatabaseDenial(await anonClient.from("feedback").select("*"), "anonymous feedback read");
  expectDatabaseDenial(await anonClient.from("products").update({ price_kobo: 1 }).eq("id", "20000000-0000-4000-8000-000000000001"), "anonymous product mutation");
  expectDatabaseDenial(await anonClient.from("admin_users").select("*"), "anonymous administrator read");
  expectDatabaseDenial(await anonClient.from("orders").insert({}), "anonymous arbitrary order insert");
  expectDatabaseDenial(await anonClient.from("payments").update({ status: "paid" }).eq("order_id", testOrderId), "anonymous payment mutation");
  expectDatabaseDenial(await anonClient.from("checkout_settings").update({ paystack_enabled: false }).eq("id", true), "anonymous checkout-settings mutation");

  const nonAdminClient = await signIn(url, anonKey, nonAdmin.email, password);
  assert.equal(expectSuccess(await nonAdminClient.from("admin_users").select("id"), "non-admin own authorization lookup").length, 0);
  assert.equal(expectSuccess(await nonAdminClient.from("orders").select("id"), "non-admin private order query").length, 0);
  assert.equal(expectSuccess(await nonAdminClient.from("products").update({ price_kobo: 1 }).eq("id", "20000000-0000-4000-8000-000000000001").select("id"), "authenticated non-admin product mutation filtered by RLS").length, 0);

  const inactiveClient = await signIn(url, anonKey, inactiveAdmin.email, password);
  const inactiveProfile = expectSuccess(await inactiveClient.from("admin_users").select("id,is_active").single(), "inactive admin own profile");
  assert.equal(inactiveProfile.is_active, false);
  assert.equal(expectSuccess(await inactiveClient.from("orders").select("id"), "inactive admin order query").length, 0);
  assert.equal(expectSuccess(await inactiveClient.from("products").update({ price_kobo: 1 }).eq("id", "20000000-0000-4000-8000-000000000001").select("id"), "inactive admin product mutation filtered by RLS").length, 0);

  const activeClients = new Map();
  for (const [role, identity] of [["owner", owner], ["admin", admin], ["editor", editor]]) {
    const client = await signIn(url, anonKey, identity.email, password);
    activeClients.set(role, client);
    const profile = expectSuccess(await client.from("admin_users").select("id,role,is_active").single(), `${role} authorization lookup`);
    assert.equal(profile.role, role);
    assert.equal(profile.is_active, true);
  }

  const ownerClient = activeClients.get("owner");
  assert.equal(expectSuccess(await ownerClient.from("orders").select("id").eq("id", testOrderId), "active-admin order read").length, 1);
  assert.equal(expectSuccess(await ownerClient.from("feedback").select("id").eq("email", feedbackEmail), "active-admin feedback read").length, 1);

  const category = expectSuccess(await ownerClient.from("categories").insert({
    name: `Cycle 3 Test ${suffix}`,
    slug: `cycle-3-test-${suffix}`,
    is_enabled: false,
  }).select("id").single(), "active-admin category insert");
  testCategoryId = category.id;
  expectSuccess(await ownerClient.from("categories").update({ sort_order: 999 }).eq("id", testCategoryId), "active-admin category update");
  expectSuccess(await ownerClient.from("categories").delete().eq("id", testCategoryId), "active-admin category delete");
  testCategoryId = undefined;

  expectDatabaseDenial(await ownerClient.from("orders").insert({}), "active-admin authoritative order insert");
  expectDatabaseDenial(await ownerClient.from("payments").update({ status: "paid" }).eq("order_id", testOrderId), "active-admin payment mutation");
  const currentSettings = expectSuccess(await ownerClient.from("checkout_settings").select("paystack_enabled,whatsapp_enabled").single(), "owner settings read");
  expectSuccess(await ownerClient.from("checkout_settings").update(currentSettings).eq("id", true).select("paystack_enabled").single(), "owner payment-setting permission");
  const editorSettings = expectSuccess(await activeClients.get("editor").from("checkout_settings").update(currentSettings).eq("id", true).select("paystack_enabled"), "editor settings update is filtered by RLS");
  assert.equal(editorSettings.length, 0, "editor cannot update payment settings");

  const storage = memoryStorage();
  const persistentOptions = clientOptions({ storage, persistSession: true });
  const persistentClient = await signIn(url, anonKey, owner.email, password, persistentOptions);
  const reloadedClient = createClient(url, anonKey, persistentOptions);
  const { data: persistedSession, error: persistedSessionError } = await reloadedClient.auth.getSession();
  assert.equal(persistedSessionError, null);
  assert.equal(persistedSession.session?.user.id, owner.id, "session persists through shared browser storage");
  const { error: logoutError } = await persistentClient.auth.signOut({ scope: "local" });
  assert.equal(logoutError, null);
  const { data: loggedOutSession } = await persistentClient.auth.getSession();
  assert.equal(loggedOutSession.session, null, "logout removes the local session");

  console.log("Cycle 3 direct Auth and RLS security checks passed.");
} finally {
  if (testCategoryId) await serviceClient.from("categories").delete().eq("id", testCategoryId);
  await serviceClient.from("feedback").delete().eq("email", feedbackEmail);
  if (testOrderId) {
    await serviceClient.from("payments").delete().eq("order_id", testOrderId);
    await serviceClient.from("orders").delete().eq("id", testOrderId);
  }
  for (const user of createdUsers) {
    await serviceClient.auth.admin.deleteUser(user.id);
  }
}
