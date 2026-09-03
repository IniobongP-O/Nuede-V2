import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { checkoutSubmissionSchema } from "@nuede/validation/checkout";
import { loadOrderContext, validateOrderContext } from "../supabase/functions/_shared/order/catalog.js";
import { createAuthoritativeOrder } from "../supabase/functions/_shared/order/engine.js";
import { OrderError } from "../supabase/functions/_shared/order/errors.js";
import { addKobo, calculateItemPrice, multiplyKobo } from "../supabase/functions/_shared/order/pricing.js";
import { flattenOrderItems } from "../supabase/functions/_shared/order/request.js";
import { buildOrderSnapshot } from "../supabase/functions/_shared/order/snapshots.js";
import { handleCreateOrderRequest } from "../supabase/functions/create-order/handler.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");

const IDs = Object.freeze({
  standard: "20000000-0000-4000-8000-000000000001",
  grouped: "20000000-0000-4000-8000-000000000002",
  otherGrouped: "20000000-0000-4000-8000-000000000003",
  unavailableProduct: "20000000-0000-4000-8000-000000000004",
  variant: "30000000-0000-4000-8000-000000000001",
  wrongVariant: "30000000-0000-4000-8000-000000000002",
  hiddenVariant: "30000000-0000-4000-8000-000000000003",
  addon: "40000000-0000-4000-8000-000000000001",
  unavailableAddon: "40000000-0000-4000-8000-000000000002",
  wrongAddon: "40000000-0000-4000-8000-000000000003",
  zone: "50000000-0000-4000-8000-000000000001",
});

const customer = Object.freeze({
  fullName: " Ada Okafor ",
  phone: " 08000000000 ",
  email: " ada@example.com ",
  address: " 14 Quiet Street, Abuja ",
  landmark: " Gate two ",
});

const standardConfiguration = Object.freeze({
  productId: IDs.standard,
  variantId: null,
  addonIds: [IDs.addon],
  quantity: 2,
});

function cartPayload(configuration = standardConfiguration) {
  return {
    orderType: "cart",
    customer: { ...customer },
    deliveryZoneId: IDs.zone,
    paymentMethod: "paystack",
    items: [{ ...configuration, addonIds: [...configuration.addonIds] }],
  };
}

function mealPlanPayload() {
  return {
    orderType: "meal_plan",
    customer: { ...customer },
    deliveryZoneId: IDs.zone,
    paymentMethod: "whatsapp",
    durationDays: 2,
    startDate: "2026-09-04",
    days: [
      {
        date: "2026-09-04",
        slots: { breakfast: null, lunch: { ...standardConfiguration, quantity: 1, addonIds: [] }, dinner: null, snack: null },
      },
      {
        date: "2026-09-05",
        slots: { breakfast: null, lunch: null, dinner: { productId: IDs.grouped, variantId: IDs.variant, addonIds: [IDs.addon], quantity: 1 }, snack: null },
      },
    ],
  };
}

function context(overrides = {}) {
  return {
    products: [
      { id: IDs.standard, name: "Meal A", product_type: "standard", price_kobo: 800_000, calories: 500, protein_g: "30.00", carbohydrates_g: "45.00", fat_g: "12.00", status: "available", requires_variant_selection: false, default_variant_id: null },
      { id: IDs.grouped, name: "Build a Bowl", product_type: "grouped", price_kobo: null, calories: null, protein_g: null, carbohydrates_g: null, fat_g: null, status: "available", requires_variant_selection: true, default_variant_id: null },
      { id: IDs.otherGrouped, name: "Other Group", product_type: "grouped", price_kobo: null, calories: null, protein_g: null, carbohydrates_g: null, fat_g: null, status: "available", requires_variant_selection: true, default_variant_id: null },
      { id: IDs.unavailableProduct, name: "Sold Meal", product_type: "standard", price_kobo: 700_000, calories: null, protein_g: null, carbohydrates_g: null, fat_g: null, status: "sold_out", requires_variant_selection: false, default_variant_id: null },
    ],
    variants: [
      { id: IDs.variant, product_id: IDs.grouped, name: "Rice", price_kobo: 850_000, calories: 600, protein_g: "25.00", carbohydrates_g: "80.00", fat_g: "9.00", status: "available" },
      { id: IDs.wrongVariant, product_id: IDs.otherGrouped, name: "Elsewhere", price_kobo: 100, calories: 1, protein_g: "1.00", carbohydrates_g: "1.00", fat_g: "1.00", status: "available" },
      { id: IDs.hiddenVariant, product_id: IDs.grouped, name: "Hidden", price_kobo: 100, calories: 1, protein_g: "1.00", carbohydrates_g: "1.00", fat_g: "1.00", status: "hidden" },
    ],
    addons: [
      { id: IDs.addon, name: "Extra Chicken", price_kobo: 100_000, calories: 200, protein_g: "20.00", carbohydrates_g: null, fat_g: "5.00", is_available: true },
      { id: IDs.unavailableAddon, name: "Unavailable", price_kobo: 1, calories: 1, protein_g: "1.00", carbohydrates_g: "1.00", fat_g: "1.00", is_available: false },
      { id: IDs.wrongAddon, name: "Other Add-on", price_kobo: 1, calories: 1, protein_g: "1.00", carbohydrates_g: "1.00", fat_g: "1.00", is_available: true },
    ],
    assignments: [
      { product_id: IDs.standard, addon_id: IDs.addon },
      { product_id: IDs.standard, addon_id: IDs.unavailableAddon },
      { product_id: IDs.grouped, addon_id: IDs.addon },
      { product_id: IDs.otherGrouped, addon_id: IDs.wrongAddon },
    ],
    deliveryZone: { id: IDs.zone, name: "Central", fee_kobo: 200_000, is_active: true },
    checkoutSettings: { paystack_enabled: true, whatsapp_enabled: true },
    ...overrides,
  };
}

function parsedAndValidated(payload, loadedContext = context()) {
  const request = checkoutSubmissionSchema.parse(payload);
  const items = flattenOrderItems(request);
  return { request, validated: validateOrderContext(request, items, loadedContext) };
}

function assertOrderError(callback, code) {
  assert.throws(callback, (error) => error instanceof OrderError && error.code === code);
}

function queryClient(responses, calls) {
  return {
    from(table) {
      const builder = {
        select(columns) {
          calls.push({ table, operation: "select", columns });
          return builder;
        },
        in(column, values) {
          calls.push({ table, operation: "in", column, values });
          return builder;
        },
        eq(column, value) {
          calls.push({ table, operation: "eq", column, value });
          return builder;
        },
        maybeSingle() {
          return Promise.resolve(responses[table]);
        },
        then(resolve, reject) {
          return Promise.resolve(responses[table]).then(resolve, reject);
        },
      };
      return builder;
    },
  };
}

test("Cycle 12 request schema preserves Cycle 11 contracts, trims customer data, and rejects malformed schedules", () => {
  const cart = checkoutSubmissionSchema.parse(cartPayload());
  assert.equal(cart.customer.fullName, "Ada Okafor");
  assert.equal(cart.items[0].quantity, 2);
  assert.equal(checkoutSubmissionSchema.safeParse({ ...mealPlanPayload(), durationDays: 3 }).success, false);
  const nonConsecutive = mealPlanPayload();
  nonConsecutive.days[1].date = "2026-09-06";
  assert.equal(checkoutSubmissionSchema.safeParse(nonConsecutive).success, false);
  const arbitrarySlot = mealPlanPayload();
  arbitrarySlot.days[0].slots.midnight = standardConfiguration;
  assert.equal(checkoutSubmissionSchema.safeParse(arbitrarySlot).success, false);
  const multipliedSlot = mealPlanPayload();
  multipliedSlot.days[0].slots.lunch.quantity = 2;
  assert.equal(checkoutSubmissionSchema.safeParse(multipliedSlot).success, false);
});

test("Cycle 12 rejects all client-supplied financial, availability, and nutrition authority", () => {
  for (const field of ["subtotal", "deliveryFee", "total", "amount", "nutrition"]) {
    assert.equal(checkoutSubmissionSchema.safeParse({ ...cartPayload(), [field]: 1 }).success, false, field);
  }
  for (const field of ["price", "unitPrice", "lineTotal", "available", "nutrition"]) {
    const payload = cartPayload();
    payload.items[0][field] = 1;
    assert.equal(checkoutSubmissionSchema.safeParse(payload).success, false, field);
  }
  const eightyNairaAttack = cartPayload();
  eightyNairaAttack.items[0].price = 8_000;
  eightyNairaAttack.total = 8_000;
  assert.equal(checkoutSubmissionSchema.safeParse(eightyNairaAttack).success, false);
});

test("Cycle 12 rejects duplicate add-ons and invalid quantities before catalog access", () => {
  const duplicate = cartPayload({ ...standardConfiguration, addonIds: [IDs.addon, IDs.addon] });
  assert.equal(checkoutSubmissionSchema.safeParse(duplicate).success, false);
  for (const quantity of [0, -1, 1.5, Number.NaN, "2", 2_147_483_648]) {
    assert.equal(checkoutSubmissionSchema.safeParse(cartPayload({ ...standardConfiguration, quantity })).success, false, String(quantity));
  }
  assert.equal(checkoutSubmissionSchema.safeParse({ ...cartPayload(), items: [] }).success, false);
  assert.equal(checkoutSubmissionSchema.safeParse({ ...cartPayload(), paymentMethod: "cash" }).success, false);
});

test("Cycle 12 integer-kobo arithmetic is exact and overflow-safe", () => {
  assert.equal(addKobo([800_000, 100_000]), 900_000);
  assert.equal(multiplyKobo(900_000, 2), 1_800_000);
  assert.deepEqual(calculateItemPrice({ basePriceKobo: 800_000, addons: [{ price_kobo: "100000" }], configuration: { quantity: 2 } }), {
    addonPriceKobo: 100_000,
    unitPriceKobo: 900_000,
    lineTotalKobo: 1_800_000,
  });
  assertOrderError(() => addKobo([Number.MAX_SAFE_INTEGER, 1]), "ORDER_VALUE_OUT_OF_RANGE");
});

test("Cycle 12 batches unique catalog IDs and loads zone/settings once", async () => {
  const calls = [];
  const loaded = context();
  const responses = {
    products: { data: loaded.products.slice(0, 1), error: null },
    product_variants: { data: [], error: null },
    product_addons: { data: loaded.addons.slice(0, 1), error: null },
    product_addon_assignments: { data: loaded.assignments.slice(0, 1), error: null },
    delivery_zones: { data: loaded.deliveryZone, error: null },
    checkout_settings: { data: loaded.checkoutSettings, error: null },
  };
  const request = checkoutSubmissionSchema.parse({ ...cartPayload(), items: [standardConfiguration, standardConfiguration] });
  const items = flattenOrderItems(request);
  const result = await loadOrderContext(queryClient(responses, calls), request, items);
  assert.equal(result.products.length, 1);
  const productFilter = calls.find((call) => call.table === "products" && call.operation === "in");
  assert.deepEqual(productFilter.values, [IDs.standard]);
  assert.equal(calls.filter((call) => call.table === "delivery_zones" && call.operation === "select").length, 1);
  assert.equal(calls.filter((call) => call.table === "checkout_settings" && call.operation === "select").length, 1);
});

test("Cycle 12 revalidates standard/grouped variants and product availability", () => {
  assert.equal(parsedAndValidated(cartPayload()).validated.items[0].basePriceKobo, 800_000);
  const grouped = { productId: IDs.grouped, variantId: IDs.variant, addonIds: [], quantity: 1 };
  assert.equal(parsedAndValidated(cartPayload(grouped)).validated.items[0].basePriceKobo, 850_000);
  assertOrderError(() => parsedAndValidated(cartPayload({ ...standardConfiguration, variantId: IDs.variant })), "INVALID_VARIANT");
  assertOrderError(() => parsedAndValidated(cartPayload({ ...grouped, variantId: null })), "INVALID_VARIANT");
  assertOrderError(() => parsedAndValidated(cartPayload({ ...grouped, variantId: IDs.wrongVariant })), "INVALID_VARIANT");
  assertOrderError(() => parsedAndValidated(cartPayload({ ...grouped, variantId: IDs.hiddenVariant })), "VARIANT_NOT_AVAILABLE");
  const soldOutVariantContext = context();
  soldOutVariantContext.variants[0] = { ...soldOutVariantContext.variants[0], status: "sold_out" };
  assertOrderError(() => parsedAndValidated(cartPayload(grouped), soldOutVariantContext), "VARIANT_NOT_AVAILABLE");
  assertOrderError(() => parsedAndValidated(cartPayload({ productId: IDs.unavailableProduct, variantId: null, addonIds: [], quantity: 1 })), "PRODUCT_NOT_AVAILABLE");
  assertOrderError(() => parsedAndValidated(cartPayload({ productId: "20000000-0000-4000-8000-000000000099", variantId: null, addonIds: [], quantity: 1 })), "PRODUCT_NOT_AVAILABLE");
  for (const status of ["hidden", "archived", "price_pending", "unavailable"]) {
    const unavailableContext = context();
    unavailableContext.products[0] = { ...unavailableContext.products[0], status, price_kobo: status === "price_pending" ? null : 800_000 };
    assertOrderError(() => parsedAndValidated(cartPayload(), unavailableContext), "PRODUCT_NOT_AVAILABLE");
  }
});

test("Cycle 12 revalidates add-on relationships, availability, delivery, and payment settings", () => {
  assertOrderError(() => parsedAndValidated(cartPayload({ ...standardConfiguration, addonIds: [IDs.wrongAddon] })), "INVALID_ADDON");
  assertOrderError(() => parsedAndValidated(cartPayload({ ...standardConfiguration, addonIds: [IDs.unavailableAddon] })), "ADDON_NOT_AVAILABLE");
  assertOrderError(() => parsedAndValidated(cartPayload(), context({ deliveryZone: { id: IDs.zone, name: "Central", fee_kobo: 1, is_active: false } })), "DELIVERY_ZONE_UNAVAILABLE");
  assertOrderError(() => parsedAndValidated(cartPayload(), context({ checkoutSettings: { paystack_enabled: false, whatsapp_enabled: true } })), "PAYMENT_METHOD_DISABLED");
});

test("Cycle 12 snapshots authoritative cart price, partial nutrition, delivery, and immutable names", () => {
  const { request, validated } = parsedAndValidated(cartPayload());
  const snapshot = buildOrderSnapshot(request, validated);
  assert.equal(snapshot.items[0].product_name, "Meal A");
  assert.equal(snapshot.items[0].unit_base_price_kobo, 800_000);
  assert.equal(snapshot.items[0].configured_unit_price_kobo, 900_000);
  assert.equal(snapshot.items[0].line_total_kobo, 1_800_000);
  assert.equal(snapshot.order.subtotal_kobo, 1_800_000);
  assert.equal(snapshot.order.delivery_fee_kobo, 200_000);
  assert.equal(snapshot.order.total_kobo, 2_000_000);
  assert.equal(snapshot.order.nutrition_completeness, "partial");
  assert.equal(snapshot.order.total_calories, 1_400);
  assert.equal(snapshot.items[0].addons[0].addon_name, "Extra Chicken");
  assert.equal(snapshot.items[0].addons[0].unit_price_kobo, 100_000);
  validated.items[0].product.name = "Meal A Updated";
  validated.items[0].product.price_kobo = 1_000_000;
  assert.equal(snapshot.items[0].product_name, "Meal A");
  assert.equal(snapshot.items[0].unit_base_price_kobo, 800_000);
});

test("Cycle 12 preserves complete, partial, and unavailable nutrition without converting missing values to zero", () => {
  const completePayload = cartPayload({ ...standardConfiguration, addonIds: [], quantity: 1 });
  const complete = buildOrderSnapshot(...Object.values(parsedAndValidated(completePayload)));
  assert.equal(complete.order.nutrition_completeness, "complete");
  const partial = buildOrderSnapshot(...Object.values(parsedAndValidated(cartPayload())));
  assert.equal(partial.order.nutrition_completeness, "partial");
  const unavailableContext = context();
  unavailableContext.products[0] = { ...unavailableContext.products[0], calories: null, protein_g: null, carbohydrates_g: null, fat_g: null };
  const parsed = parsedAndValidated(completePayload, unavailableContext);
  const unavailable = buildOrderSnapshot(parsed.request, parsed.validated);
  assert.equal(unavailable.order.nutrition_completeness, "unavailable");
  assert.equal(unavailable.order.total_calories, null);
});

test("Cycle 12 meal-plan pricing preserves slots and adds delivery exactly once", () => {
  const { request, validated } = parsedAndValidated(mealPlanPayload());
  const snapshot = buildOrderSnapshot(request, validated);
  assert.deepEqual(snapshot.items.map((item) => [item.scheduled_for, item.meal_slot]), [
    ["2026-09-04", "lunch"],
    ["2026-09-05", "dinner"],
  ]);
  assert.equal(snapshot.order.meal_plan_start_date, "2026-09-04");
  assert.equal(snapshot.order.meal_plan_end_date, "2026-09-05");
  assert.equal(snapshot.order.subtotal_kobo, 1_750_000);
  assert.equal(snapshot.order.total_kobo, 1_950_000);
});

test("Cycle 12 engine reprices stale browser selections and returns only persisted server authority", async () => {
  const changedContext = context();
  changedContext.products[0] = { ...changedContext.products[0], price_kobo: 900_000 };
  changedContext.addons[0] = { ...changedContext.addons[0], price_kobo: 150_000 };
  changedContext.deliveryZone = { ...changedContext.deliveryZone, fee_kobo: 300_000 };
  let persistedSnapshot;
  const response = await createAuthoritativeOrder(cartPayload(), null, {
    loadContext: async () => changedContext,
    persist: async (_client, snapshot) => {
      persistedSnapshot = snapshot;
      return { order_id: "70000000-0000-4000-8000-000000000001", order_reference: "NUE-001001", created_at: "2026-09-03T12:00:00Z", payment_status: "unpaid", fulfilment_status: "pending" };
    },
  });
  assert.equal(response.subtotalKobo, 2_100_000);
  assert.equal(response.deliveryFeeKobo, 300_000);
  assert.equal(response.totalKobo, 2_400_000);
  assert.equal(response.paymentStatus, "unpaid");
  assert.equal(response.fulfilmentStatus, "pending");
  assert.equal(persistedSnapshot.order.payment_status, undefined);
});

test("Cycle 12 HTTP handler handles CORS, method, JSON, safe errors, and success", async () => {
  assert.equal((await handleCreateOrderRequest(new Request("http://local", { method: "OPTIONS" }))).status, 204);
  assert.equal((await handleCreateOrderRequest(new Request("http://local", { method: "GET" }))).status, 405);
  assert.equal((await handleCreateOrderRequest(new Request("http://local", { method: "POST", body: "{" }))).status, 400);
  const logs = [];
  const invalid = await handleCreateOrderRequest(new Request("http://local", { method: "POST", body: JSON.stringify({}) }), {
    client: null,
    logger: { error: (...args) => logs.push(args) },
  });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, "INVALID_REQUEST");
  assert.deepEqual(Object.keys(logs[0][1]).sort(), ["code", "stage"]);
  const success = await handleCreateOrderRequest(new Request("http://local", { method: "POST", body: JSON.stringify(cartPayload()) }), {
    client: null,
    createOrder: async () => ({ orderId: "70000000-0000-4000-8000-000000000001" }),
  });
  assert.equal(success.status, 201);
  assert.equal((await success.json()).order.orderId, "70000000-0000-4000-8000-000000000001");
});

test("Cycle 12 source keeps service-role use backend-only and defers Paystack/WhatsApp flows", async () => {
  const indexSource = await read("supabase/functions/create-order/index.js");
  const handlerSource = await read("supabase/functions/create-order/handler.js");
  const storefrontSource = await read("apps/storefront/src/pages/CheckoutPage.jsx");
  const migration = await read("supabase/migrations/20260903000200_create_secure_order_persistence.sql");
  assert.match(indexSource, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(storefrontSource, /SUPABASE_SERVICE_ROLE_KEY|create-order|\.from\(["']orders/);
  assert.doesNotMatch(`${indexSource}\n${handlerSource}`, /paystack\.co|wa\.me|window\.open|PAYSTACK_SECRET_KEY/);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = ''/i);
  assert.match(migration, /revoke all on function public\.create_order_atomic\(jsonb, jsonb\) from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.create_order_atomic\(jsonb, jsonb\) to service_role/i);
  assert.match(migration, /nextval\('private\.order_reference_sequence'/i);
});
