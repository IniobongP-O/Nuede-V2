import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  canCancelFulfilment,
  canTransitionFulfilmentStatus,
  hasActiveOrderFilters,
  humanizeOrderValue,
  nextFulfilmentAction,
  normalizeOrdersPage,
} from "../packages/domain/src/orders.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Cycle 15 permits only the documented forward fulfilment sequence", () => {
  const workflow = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];
  for (let index = 0; index < workflow.length - 1; index += 1) {
    assert.equal(nextFulfilmentAction(workflow[index]), workflow[index + 1]);
    assert.equal(canTransitionFulfilmentStatus(workflow[index], workflow[index + 1]), true);
  }
  assert.equal(nextFulfilmentAction("delivered"), null);
  assert.equal(canTransitionFulfilmentStatus("delivered", "preparing"), false);
  assert.equal(canTransitionFulfilmentStatus("pending", "delivered"), false);
  assert.equal(canTransitionFulfilmentStatus("cancelled", "pending"), false);
});

test("Cycle 15 cancellation is explicit, pre-dispatch, and terminal", () => {
  for (const status of ["pending", "confirmed", "preparing", "ready"]) {
    assert.equal(canCancelFulfilment(status), true);
    assert.equal(canTransitionFulfilmentStatus(status, "cancelled"), true);
  }
  for (const status of ["out_for_delivery", "delivered", "cancelled"]) {
    assert.equal(canCancelFulfilment(status), false);
    assert.equal(canTransitionFulfilmentStatus(status, "cancelled"), false);
  }
});

test("Cycle 15 order labels and URL filter helpers preserve canonical values", () => {
  assert.equal(humanizeOrderValue("out_for_delivery"), "Out for delivery");
  assert.equal(humanizeOrderValue("meal_plan"), "Meal plan");
  assert.equal(humanizeOrderValue("whatsapp"), "WhatsApp");
  assert.equal(normalizeOrdersPage("5"), 5);
  assert.equal(normalizeOrdersPage("bad"), 1);
  assert.equal(hasActiveOrderFilters({ search: "NUE-15" }), true);
  assert.equal(hasActiveOrderFilters({ search: "", paymentStatus: "" }), false);
});

test("Cycle 15 list RPC composes server-side search, filters, newest-first pagination, and active-admin authorization", async () => {
  const migration = await read("supabase/migrations/20260903000400_enable_admin_order_management.sql");
  assert.match(migration, /create or replace function public\.list_admin_orders/);
  assert.match(migration, /create extension if not exists pg_trgm/);
  for (const index of ["orders_reference_search_idx", "orders_customer_name_search_idx", "orders_customer_phone_search_idx", "payments_provider_reference_search_idx"]) assert.match(migration, new RegExp(index));
  assert.match(migration, /if not \(select private\.is_active_admin\(\)\)/);
  assert.match(migration, /order_reference ilike/);
  assert.match(migration, /customer_name ilike/);
  assert.match(migration, /customer_phone ilike/);
  assert.match(migration, /searched_payment\.provider_reference ilike/);
  for (const filter of ["p_fulfilment_status", "p_payment_status", "p_payment_method", "p_order_type", "p_created_from", "p_created_to"]) assert.match(migration, new RegExp(filter));
  assert.match(migration, /order by order_row\.created_at desc, order_row\.id desc/);
  assert.match(migration, /limit safe_page_size/);
  assert.match(migration, /grant execute on function public\.list_admin_orders[\s\S]*to authenticated/);
  assert.match(migration, /revoke all on function public\.list_admin_orders[\s\S]*from public, anon, authenticated/);
});

test("Cycle 15 mutation is minimal, locked, validated, audited, and cannot alter payment or snapshot columns", async () => {
  const migration = await read("supabase/migrations/20260903000400_enable_admin_order_management.sql");
  const mutation = migration.slice(migration.indexOf("create or replace function public.update_order_fulfilment_status"));
  assert.match(mutation, /for update/);
  assert.match(mutation, /private\.can_transition_fulfilment_status/);
  assert.match(mutation, /set fulfilment_status = p_next_status/);
  assert.match(mutation, /insert into public\.admin_audit_log/);
  assert.match(mutation, /auth\.uid\(\)/);
  assert.doesNotMatch(mutation, /set\s+payment_status/i);
  assert.doesNotMatch(mutation, /set\s+(subtotal_kobo|total_kobo|delivery_fee_kobo|order_reference)/i);
  assert.doesNotMatch(mutation, /p_admin|updated_by_admin/i);
});

test("Cycle 15 frontend keeps data access centralized and renders stored snapshots/payment detail", async () => {
  const page = await read("apps/admin/src/pages/OrdersPage.jsx");
  const detail = await read("apps/admin/src/pages/OrderDetailPage.jsx");
  const api = await read("apps/admin/src/features/orders/api/ordersApi.js");
  const sections = await read("apps/admin/src/features/orders/components/OrderDetailSections.jsx");
  const actions = await read("apps/admin/src/features/orders/components/FulfilmentActions.jsx");
  assert.doesNotMatch(`${page}\n${detail}\n${sections}\n${actions}`, /supabase\.from|\.from\(["']orders/);
  assert.match(api, /\.rpc\("list_admin_orders"/);
  assert.match(api, /order_items \([\s\S]*order_item_addons/);
  assert.match(api, /payments \(/);
  assert.match(sections, /unit_base_price_kobo/);
  assert.match(sections, /line_total_kobo/);
  assert.match(sections, /provider_reference/);
  assert.match(sections, /scheduled_for/);
  assert.match(sections, /nutrition_completeness/);
  assert.match(actions, /paid order is not automatically refunded/i);
});

test("Cycle 15 list offers all required filters, mobile cards, distinct empty states, and deep links", async () => {
  const filters = await read("apps/admin/src/features/orders/components/OrderFilters.jsx");
  const list = await read("apps/admin/src/features/orders/components/OrdersList.jsx");
  const page = await read("apps/admin/src/pages/OrdersPage.jsx");
  for (const value of ["fulfilmentStatus", "paymentStatus", "paymentMethod", "orderType", "dateFrom", "dateTo"]) assert.match(filters, new RegExp(value));
  assert.match(list, /lg:hidden/);
  assert.match(list, /hidden lg:block/);
  assert.match(list, /\/orders\/\$\{encodeURIComponent/);
  assert.match(page, /No orders yet/);
  assert.match(page, /No orders match/);
});

test("Cycle 15 browser code contains no privileged secrets or payment mutation", async () => {
  const files = [
    "apps/admin/src/features/orders/api/ordersApi.js",
    "apps/admin/src/features/orders/hooks/useOrders.js",
    "apps/admin/src/pages/OrderDetailPage.jsx",
  ];
  const source = (await Promise.all(files.map(read))).join("\n");
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|PAYSTACK_SECRET_KEY|webhook.secret/i);
  assert.doesNotMatch(source, /\.update\s*\(\s*\{[^}]*payment_status/is);
  assert.doesNotMatch(source, /\.from\(["']payments["']\)\.update/i);
});
