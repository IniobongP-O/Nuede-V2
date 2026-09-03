import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { openWhatsappHandoff } from "../apps/storefront/src/features/checkout/utils/whatsappHandoff.js";
import { createAuthoritativeOrder } from "../supabase/functions/_shared/order/engine.js";
import { OrderError } from "../supabase/functions/_shared/order/errors.js";
import { buildWhatsappHandoff, buildWhatsappMessage, normalizeWhatsappRecipient } from "../supabase/functions/_shared/whatsapp.js";
import { createWhatsappOrder, handleCreateWhatsappOrderRequest } from "../supabase/functions/create-whatsapp-order/handler.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");

function item(overrides = {}) {
  return {
    productId: "20000000-0000-4000-8000-000000000001",
    variantId: null,
    productName: "Peppered Chicken Bowl",
    variantName: null,
    unitBasePriceKobo: 800_000,
    unitPriceKobo: 900_000,
    quantity: 2,
    lineTotalKobo: 1_800_000,
    scheduledFor: null,
    mealSlot: null,
    addons: [{ addonId: "40000000-0000-4000-8000-000000000001", addonName: "Extra Chicken", unitPriceKobo: 100_000 }],
    ...overrides,
  };
}

function authoritativeOrder(overrides = {}) {
  return {
    orderId: "70000000-0000-4000-8000-000000000001",
    orderReference: "NUE-001048",
    createdAt: "2026-09-03T12:00:00Z",
    orderType: "cart",
    paymentMethod: "whatsapp",
    paymentStatus: "unpaid",
    fulfilmentStatus: "pending",
    subtotalKobo: 1_800_000,
    deliveryFeeKobo: 200_000,
    totalKobo: 2_000_000,
    customer: { fullName: "Ada Okafor", phone: "08000000000", email: "ada@example.com" },
    delivery: { address: "14 Quiet Street, Abuja", landmark: "Gate two", zone: { id: "50000000-0000-4000-8000-000000000001", name: "Central" } },
    deliveryZone: { id: "50000000-0000-4000-8000-000000000001", name: "Central" },
    items: [item()],
    schedule: null,
    ...overrides,
  };
}

function whatsappPayload(overrides = {}) {
  return {
    orderType: "cart",
    customer: { fullName: "Ada Okafor", phone: "08000000000", email: "", address: "14 Quiet Street, Abuja", landmark: "" },
    deliveryZoneId: "50000000-0000-4000-8000-000000000001",
    paymentMethod: "whatsapp",
    items: [{ productId: "20000000-0000-4000-8000-000000000001", variantId: null, addonIds: [], quantity: 1 }],
    ...overrides,
  };
}

test("Cycle 13 normalizes only international WhatsApp recipients and keeps configuration backend-safe", () => {
  assert.equal(normalizeWhatsappRecipient("+234 (800) 000-0000"), "2348000000000");
  assert.equal(normalizeWhatsappRecipient("2348000000000"), "2348000000000");
  for (const invalid of [undefined, "", "08000000000", "+12", "+234-hello", "1234567890123456"]) {
    assert.throws(() => normalizeWhatsappRecipient(invalid), (error) => error instanceof OrderError && error.code === "WHATSAPP_CONFIGURATION_ERROR");
  }
});

test("Cycle 13 cart message uses snapshot names, variants, add-ons, quantities, delivery, and authoritative money", () => {
  const order = authoritativeOrder({
    items: [
      item({ variantId: "30000000-0000-4000-8000-000000000001", variantName: "Rice" }),
      item({ productName: "Garden Salad", quantity: 1, addons: [], lineTotalKobo: 700_000 }),
    ],
  });
  const message = buildWhatsappMessage(order);
  assert.match(message, /^Nuede Order NUE-001048/);
  assert.match(message, /Peppered Chicken Bowl — Rice\n\s{3}Quantity: 2\n\s{3}Add-ons: Extra Chicken/);
  assert.match(message, /Garden Salad\n\s{3}Quantity: 1/);
  assert.match(message, /Address: 14 Quiet Street, Abuja/);
  assert.match(message, /Landmark: Gate two/);
  assert.match(message, /Area: Central/);
  assert.match(message, /Subtotal: ₦18,000/);
  assert.match(message, /Delivery fee: ₦2,000/);
  assert.match(message, /Total: ₦20,000/);
  assert.match(message, /Payment status: Unpaid/);
  assert.doesNotMatch(message, /20000000-|30000000-|40000000-/);
  assert.doesNotMatch(message, /Garden Salad[\s\S]*Add-ons:/);
});

test("Cycle 13 meal-plan message preserves duration, dates, slots, and snapshot configurations", () => {
  const breakfast = item({ productName: "Oat Bowl", quantity: 1, addons: [], scheduledFor: "2026-09-04", mealSlot: "breakfast" });
  const dinner = item({ productName: "Build a Bowl", variantName: "Rice", quantity: 1, scheduledFor: "2026-09-05", mealSlot: "dinner" });
  const order = authoritativeOrder({
    orderType: "meal_plan",
    items: [breakfast, dinner],
    schedule: {
      durationDays: 2,
      startDate: "2026-09-04",
      endDate: "2026-09-05",
      days: [
        { date: "2026-09-04", slots: { breakfast, lunch: null, dinner: null, snack: null } },
        { date: "2026-09-05", slots: { breakfast: null, lunch: null, dinner, snack: null } },
      ],
    },
  });
  const message = buildWhatsappMessage(order);
  assert.match(message, /Meal plan: 2 days/);
  assert.match(message, /Friday, 4 September 2026\nBreakfast: Oat Bowl/);
  assert.match(message, /Saturday, 5 September 2026\nDinner: Build a Bowl — Rice/);
  assert.match(message, /Add-ons: Extra Chicken/);
});

test("Cycle 13 supports seven-day schedule metadata without hard-coded plan length", () => {
  const meal = item({ quantity: 1, addons: [] });
  const days = Array.from({ length: 7 }, (_, index) => ({
    date: `2026-09-${String(index + 4).padStart(2, "0")}`,
    slots: { breakfast: index === 6 ? meal : null, lunch: null, dinner: null, snack: null },
  }));
  const message = buildWhatsappMessage(authoritativeOrder({ orderType: "meal_plan", schedule: { durationDays: 7, days } }));
  assert.match(message, /Meal plan: 7 days/);
  assert.match(message, /Friday, 4 September 2026\nNo meals selected/);
  assert.match(message, /Thursday, 10 September 2026\nBreakfast: Peppered Chicken Bowl/);
  assert.doesNotMatch(message, /5-day/i);
});

test("Cycle 13 URL builder encodes the exact deterministic server message", () => {
  const order = authoritativeOrder();
  const handoff = buildWhatsappHandoff(order, "+234 800 000 0000");
  const url = new URL(handoff.url);
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/2348000000000");
  assert.equal(url.searchParams.get("text"), handoff.message);
  assert.equal(handoff.message, buildWhatsappMessage(order));
  assert.match(handoff.url, /%E2%82%A6/);
});

test("Cycle 13 endpoint pins WhatsApp and never invokes the order engine for Paystack", async () => {
  let invoked = false;
  await assert.rejects(
    createWhatsappOrder(whatsappPayload({ paymentMethod: "paystack" }), null, {
      recipient: "+2348000000000",
      createOrder: async () => { invoked = true; },
    }),
    (error) => error instanceof OrderError && error.code === "INVALID_PAYMENT_METHOD",
  );
  assert.equal(invoked, false);
});

test("Cycle 13 direct disabled-WhatsApp bypass returns no order and no handoff", async () => {
  let persisted = false;
  const response = await handleCreateWhatsappOrderRequest(new Request("http://local", {
    method: "POST",
    body: JSON.stringify(whatsappPayload()),
  }), {
    client: null,
    recipient: "+2348000000000",
    logger: { error() {} },
    createOrder: (candidate, client, options) => createWhatsappOrder(candidate, client, {
      ...options,
      createOrder: async () => {
        persisted = false;
        throw new OrderError("PAYMENT_METHOD_DISABLED", "Disabled", { status: 422, stage: "business_validation" });
      },
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 422);
  assert.equal(body.error.code, "WHATSAPP_DISABLED");
  assert.equal(body.order, undefined);
  assert.equal(body.whatsapp, undefined);
  assert.equal(persisted, false);
});

test("Cycle 13 direct price-manipulation request is rejected before catalog access or persistence", async () => {
  let catalogLoaded = false;
  let persisted = false;
  const response = await handleCreateWhatsappOrderRequest(new Request("http://local", {
    method: "POST",
    body: JSON.stringify(whatsappPayload({ total: 8_000, subtotal: 8_000 })),
  }), {
    client: null,
    recipient: "+2348000000000",
    logger: { error() {} },
    createOrder: (candidate, client, options) => createWhatsappOrder(candidate, client, {
      ...options,
      createOrder: (payload) => createAuthoritativeOrder(payload, null, {
        loadContext: async () => { catalogLoaded = true; },
        persist: async () => { persisted = true; },
      }),
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_REQUEST");
  assert.equal(body.order, undefined);
  assert.equal(catalogLoaded, false);
  assert.equal(persisted, false);
});

test("Cycle 13 creates the authoritative order before deriving the handoff", async () => {
  const events = [];
  const order = authoritativeOrder();
  const result = await createWhatsappOrder(whatsappPayload(), null, {
    recipient: "+2348000000000",
    createOrder: async () => { events.push("persisted"); return order; },
    buildHandoff: (createdOrder) => { events.push("handoff"); assert.equal(createdOrder, order); return { url: "https://wa.me/2348000000000?text=saved", message: "saved" }; },
  });
  assert.deepEqual(events, ["persisted", "handoff"]);
  assert.equal(result.orderReference, "NUE-001048");
  assert.equal(result.paymentMethod, "whatsapp");
  assert.equal(result.paymentStatus, "unpaid");
  assert.equal(result.fulfilmentStatus, "pending");
});

test("Cycle 13 preserves order recovery details when handoff generation fails after persistence", async () => {
  const logs = [];
  const response = await handleCreateWhatsappOrderRequest(new Request("http://local", {
    method: "POST",
    body: JSON.stringify(whatsappPayload()),
  }), {
    client: null,
    recipient: "+2348000000000",
    logger: { error: (...args) => logs.push(args) },
    createOrder: (candidate, client, options) => createWhatsappOrder(candidate, client, {
      ...options,
      createOrder: async () => authoritativeOrder(),
      buildHandoff: () => { throw new Error("formatter detail must stay private"); },
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 500);
  assert.equal(body.error.code, "WHATSAPP_HANDOFF_FAILED");
  assert.equal(body.order.orderReference, "NUE-001048");
  assert.equal(body.order.paymentStatus, "unpaid");
  assert.deepEqual(Object.keys(logs[0][1]).sort(), ["code", "orderReference", "stage"]);
  assert.doesNotMatch(JSON.stringify(body), /formatter detail/);
});

test("Cycle 13 handler provides CORS, method, JSON, and configuration failures without persistence", async () => {
  assert.equal((await handleCreateWhatsappOrderRequest(new Request("http://local", { method: "OPTIONS" }))).status, 204);
  assert.equal((await handleCreateWhatsappOrderRequest(new Request("http://local", { method: "GET" }))).status, 405);
  assert.equal((await handleCreateWhatsappOrderRequest(new Request("http://local", { method: "POST", body: "{" }))).status, 400);
  let invoked = false;
  const configurationFailure = await handleCreateWhatsappOrderRequest(new Request("http://local", { method: "POST", body: JSON.stringify(whatsappPayload()) }), {
    recipient: "",
    logger: { error() {} },
    createOrder: (candidate, client, options) => createWhatsappOrder(candidate, client, { ...options, createOrder: async () => { invoked = true; } }),
  });
  assert.equal(configurationFailure.status, 503);
  assert.equal((await configurationFailure.json()).error.code, "WHATSAPP_CONFIGURATION_ERROR");
  assert.equal(invoked, false);
});

test("Cycle 13 external opening accepts only safe WhatsApp handoffs and retry only reopens", () => {
  const calls = [];
  const opener = (...args) => { calls.push(args); return {}; };
  const url = "https://wa.me/2348000000000?text=Nuede%20Order%20NUE-001048";
  assert.equal(openWhatsappHandoff(url, opener), true);
  assert.equal(openWhatsappHandoff(url, opener), true);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], [url, "_blank", "noopener,noreferrer"]);
  for (const unsafe of ["http://wa.me/2348000000000?text=x", "https://evil.example/?text=x", "https://wa.me/not-a-phone?text=x", "javascript:alert(1)"]) {
    assert.equal(openWhatsappHandoff(unsafe, opener), false);
  }
  assert.equal(calls.length, 2);
  assert.equal(openWhatsappHandoff(url, () => null), false);
});

test("Cycle 13 storefront uses the dedicated function only for WhatsApp and retains Paystack boundary", async () => {
  const page = await read("apps/storefront/src/pages/CheckoutPage.jsx");
  const api = await read("apps/storefront/src/features/checkout/api/checkoutApi.js");
  const handoff = await read("apps/storefront/src/features/checkout/components/WhatsappOrderCreated.jsx");
  const index = await read("supabase/functions/create-whatsapp-order/index.js");
  const config = await read("supabase/config.toml");
  assert.match(page, /if \(values\.paymentMethod === "paystack"\)[\s\S]*submitCheckoutMock/);
  assert.match(page, /const order = await createWhatsappOrder\(contract\);[\s\S]*clearCart|const order = await createWhatsappOrder\(contract\);[\s\S]*clearMeals/);
  assert.match(page, /dataset\.orderSubmissionLocked === "true"[\s\S]*dataset\.orderSubmissionLocked = "true"/);
  assert.match(api, /functions\.invoke\("create-whatsapp-order"/);
  assert.match(handoff, /target="_blank" rel="noopener noreferrer"/);
  assert.match(handoff, /will not create another one/);
  assert.match(index, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(index, /NUEDE_WHATSAPP_NUMBER/);
  assert.doesNotMatch(page, /PAYSTACK_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|\.from\(["']orders/);
  assert.match(config, /\[functions\.create-whatsapp-order\][\s\S]*verify_jwt = false/);
});
