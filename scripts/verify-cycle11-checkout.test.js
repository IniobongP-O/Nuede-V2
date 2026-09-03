import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { checkoutFormSchema, checkoutSubmissionSchema } from "@nuede/validation/checkout";
import { createPlan, setSlotMeal } from "../apps/storefront/src/features/planner/utils/plannerModel.js";
import {
  buildCheckoutSubmission,
  calculateEstimatedTotal,
  CHECKOUT_SOURCE,
  getCheckoutReadiness,
  getEnabledPaymentMethods,
  normalizeCheckoutSettings,
  normalizeDeliveryZone,
  parseCheckoutSource,
} from "../apps/storefront/src/features/checkout/utils/checkoutModel.js";
import { submitCheckoutMock } from "../apps/storefront/src/features/checkout/api/mockCheckout.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");
const productId = "20000000-0000-4000-8000-000000000001";
const zoneId = "50000000-0000-4000-8000-000000000001";
const customer = { fullName: " Ada Okafor ", phone: " 08000000000 ", email: "", address: " 14 Quiet Street, Abuja ", landmark: " Gate two " };
const cartItem = { productId, variantId: null, addonIds: [], quantity: 2 };

test("Cycle 11 detects checkout source only from the explicit persistent URL value", () => {
  assert.equal(parseCheckoutSource("cart"), CHECKOUT_SOURCE.cart);
  assert.equal(parseCheckoutSource("meal-plan"), CHECKOUT_SOURCE.mealPlan);
  assert.equal(parseCheckoutSource(null), null);
  assert.equal(parseCheckoutSource("basket"), null);
});

test("Cycle 11 normalizes live delivery/settings data and filters enabled methods", () => {
  assert.deepEqual(normalizeDeliveryZone({ id: zoneId, name: "Central", fee_kobo: "250000", sort_order: 2 }), { id: zoneId, name: "Central", feeKobo: 250000, sortOrder: 2 });
  assert.throws(() => normalizeDeliveryZone({ id: zoneId, name: "Bad", fee_kobo: 1.5, sort_order: 0 }));
  const both = normalizeCheckoutSettings({ paystack_enabled: true, whatsapp_enabled: true });
  assert.deepEqual(getEnabledPaymentMethods(both).map(({ id }) => id), ["paystack", "whatsapp"]);
  assert.deepEqual(getEnabledPaymentMethods(normalizeCheckoutSettings({ paystack_enabled: false, whatsapp_enabled: true })).map(({ id }) => id), ["whatsapp"]);
  assert.deepEqual(getEnabledPaymentMethods(normalizeCheckoutSettings({ paystack_enabled: false, whatsapp_enabled: false })), []);
});

test("Cycle 11 performs estimated arithmetic in integer kobo", () => {
  assert.equal(calculateEstimatedTotal(1_800_000, 200_000), 2_000_000);
  assert.equal(calculateEstimatedTotal(1_800_000, 200_000.5), null);
  assert.equal(calculateEstimatedTotal(Number.MAX_SAFE_INTEGER, 1), null);
});

test("Cycle 11 customer validation trims fields, keeps WhatsApp email optional, and applies the Cycle 14 Paystack email boundary", () => {
  const valid = checkoutFormSchema.parse({ ...customer, deliveryZoneId: zoneId, paymentMethod: "whatsapp" });
  assert.equal(valid.fullName, "Ada Okafor");
  assert.equal(valid.email, "");
  assert.equal(valid.landmark, "Gate two");
  assert.equal(checkoutFormSchema.safeParse({ ...customer, email: "bad@", deliveryZoneId: zoneId, paymentMethod: "paystack" }).success, false);
  assert.equal(checkoutFormSchema.safeParse({ ...customer, deliveryZoneId: zoneId, paymentMethod: "paystack" }).success, false);
  assert.equal(checkoutFormSchema.safeParse({ ...customer, email: "ada@example.com", deliveryZoneId: zoneId, paymentMethod: "paystack" }).success, true);
  assert.equal(checkoutFormSchema.safeParse({ ...customer, fullName: "", deliveryZoneId: zoneId, paymentMethod: "paystack" }).success, false);
});

test("Cycle 11 builds selection-only cart and scheduled meal-plan contracts", () => {
  const cart = buildCheckoutSubmission({ source: "cart", customer: { ...customer, email: "ada@example.com" }, deliveryZoneId: zoneId, paymentMethod: "paystack", cartItems: [cartItem] });
  assert.equal(cart.orderType, "cart");
  assert.deepEqual(cart.items, [cartItem]);
  assert.doesNotMatch(JSON.stringify(cart), /subtotal|totalKobo|deliveryFee|priceKobo|nutrition/i);

  let plan = createPlan({ durationDays: 2, startDate: "2026-09-04" });
  plan = setSlotMeal(plan, { date: "2026-09-04", slot: "lunch" }, { ...cartItem, quantity: 1 });
  const planned = buildCheckoutSubmission({ source: "meal-plan", customer, deliveryZoneId: zoneId, paymentMethod: "whatsapp", plan });
  assert.equal(planned.orderType, "meal_plan");
  assert.equal(planned.days[0].slots.lunch.productId, productId);
  assert.equal(planned.days[0].slots.breakfast, null);
  assert.equal(checkoutSubmissionSchema.safeParse(planned).success, true);
});

test("Cycle 11 readiness blocks empty, invalid, stale-zone, disabled-method, and unavailable-query states", () => {
  const enabledMethods = getEnabledPaymentMethods(normalizeCheckoutSettings({ paystack_enabled: true, whatsapp_enabled: false }));
  const ready = getCheckoutReadiness({ source: "cart", sourcePending: false, sourceError: false, sourceEmpty: false, sourceIssues: [], zonesPending: false, zonesError: false, zone: { id: zoneId }, settingsPending: false, settingsError: false, enabledMethods, paymentMethod: "paystack" });
  assert.equal(ready.ready, true);
  assert.equal(getCheckoutReadiness({ ...ready, source: "cart", sourceEmpty: true, sourceIssues: [], zonesPending: false, zonesError: false, zone: null, settingsPending: false, settingsError: false, enabledMethods: [], paymentMethod: "whatsapp" }).ready, false);
  const changed = getCheckoutReadiness({ source: "cart", sourcePending: false, sourceError: false, sourceEmpty: false, sourceIssues: [], zonesPending: false, zonesError: false, zone: { id: zoneId }, settingsPending: false, settingsError: false, enabledMethods, paymentMethod: "whatsapp" });
  assert.match(changed.issues.map(({ code }) => code).join(","), /disabled_payment_method/);
});

test("Cycle 11 historical mock adapter remains isolated after the Cycle 14 Paystack branch replaces it", async () => {
  const contract = buildCheckoutSubmission({ source: "cart", customer: { ...customer, email: "ada@example.com" }, deliveryZoneId: zoneId, paymentMethod: "paystack", cartItems: [cartItem] });
  const result = await submitCheckoutMock(contract);
  assert.equal(result.accepted, true);
  assert.deepEqual(result.contract, contract);
  const api = await read("apps/storefront/src/features/checkout/api/mockCheckout.js");
  const page = await read("apps/storefront/src/pages/CheckoutPage.jsx");
  const cartDialog = await read("apps/storefront/src/features/cart/components/CartDialog.jsx");
  const plannerSummary = await read("apps/storefront/src/features/planner/components/PlannerSummary.jsx");
  assert.match(cartDialog, /checkout\}\?source=cart/);
  assert.match(plannerSummary, /source=meal-plan/);
  assert.match(page, /react-hook-form/);
  assert.match(page, /isSubmitting/);
  assert.match(page, /submissionLocked/);
  assert.doesNotMatch(api, /\.from\(["']orders|order_items|payments|wa\.me|paystack\.co|clearCart|clearMeals/i);
  assert.match(page, /if \(values\.paymentMethod === "paystack"\)[\s\S]*initializePaystackCheckout/);
  assert.doesNotMatch(page, /paystack\.co|PAYSTACK_SECRET_KEY|\.from\(["'](?:orders|order_items|payments)/i);
});

test("Cycle 11 keeps live queries centralized and admin updates narrowly authorized", async () => {
  const api = await read("apps/storefront/src/features/checkout/api/checkoutApi.js");
  const page = await read("apps/storefront/src/pages/CheckoutPage.jsx");
  const migration = await read("supabase/migrations/20260903000100_enable_admin_checkout_settings.sql");
  assert.match(api, /\.eq\("is_active", true\)/);
  assert.match(api, /checkout_payment_options/);
  assert.doesNotMatch(page, /\.from\(/);
  assert.match(migration, /active_admin_update/);
  assert.match(migration, /grant update \(paystack_enabled, whatsapp_enabled, updated_by\)/);
  assert.doesNotMatch(migration, /orders|payments|service_role/i);
});
