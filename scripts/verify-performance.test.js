import assert from "node:assert/strict";
import test from "node:test";
import { createCatalogInvalidator } from "../apps/storefront/src/features/menu/utils/catalogInvalidation.js";
import { createCustomizationState, customizationReducer, reconcileCustomization } from "../apps/storefront/src/features/product-detail/utils/customizationState.js";
import { buildProductConfiguration } from "../apps/storefront/src/features/product-detail/utils/customizationModel.js";

test("catalog bursts coalesce, categories include products, and continuous edits have a bounded window", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const requests = [];
  const invalidator = createCatalogInvalidator({ invalidateQueries: ({ queryKey }) => requests.push(queryKey) }, { products: "products", categories: "categories" });
  for (let i = 0; i < 5; i++) { invalidator.products(); t.mock.timers.tick(15); }
  invalidator.categories(); invalidator.categories();
  assert.deepEqual(requests, []);
  t.mock.timers.tick(25);
  assert.deepEqual(requests, ["categories", "products"]);
  invalidator.products(); t.mock.timers.tick(100);
  assert.deepEqual(requests, ["categories", "products", "products"]);
  invalidator.categories(); invalidator.cancel(); t.mock.timers.tick(1000);
  invalidator.products(); t.mock.timers.tick(1000);
  assert.equal(requests.length, 3, "unmounted subscriptions must not refetch");
});

const productId = "20000000-0000-4000-8000-000000000001";
const variantId = "30000000-0000-4000-8000-000000000001";
const addonId = "40000000-0000-4000-8000-000000000001";
const product = { id: productId, isGrouped: true, status: "available", menuStatus: "available", requiresVariantSelection: false, defaultVariantId: variantId, variants: [{ id: variantId, productId, status: "available", priceKobo: 10000 }], addons: [{ id: addonId, isAvailable: true, priceKobo: 1000 }] };
test("catalog transitions remove invalid selections before effects or quantity interactions", () => {
  let state = createCustomizationState({ product });
  state = customizationReducer(state, { type: "addon", product, addonId });
  const fresh = { ...product, variants: [{ ...product.variants[0], status: "sold_out" }], addons: [] };
  const rendered = reconcileCustomization(state, fresh);
  assert.equal(rendered.variantId, null); assert.deepEqual(rendered.addonIds, []);
  assert.match(rendered.catalogNotice, /must be selected again/);
  assert.equal(buildProductConfiguration({ product: fresh, ...rendered }).valid, false);
  const interacted = customizationReducer(state, { type: "increment", product: fresh });
  assert.equal(interacted.variantId, null); assert.deepEqual(interacted.addonIds, []); assert.equal(interacted.quantity, 2);
  assert.deepEqual(customizationReducer(interacted, { type: "catalog-refreshed", product: fresh }), interacted);
});
test("required/default choices, notices and selected-only configuration survive catalog refreshes", () => {
  assert.equal(createCustomizationState({ product }).variantId, variantId);
  assert.equal(createCustomizationState({ product: { ...product, requiresVariantSelection: true } }).variantId, null);
  let state = createCustomizationState({ product, initialConfiguration: { productId, variantId, addonIds: [addonId], quantity: 3 } });
  const fresh = { ...product, addons: [{ ...product.addons[0], isAvailable: false }] };
  state = reconcileCustomization(state, fresh);
  assert.equal(state.variantId, variantId); assert.equal(state.quantity, 3); assert.match(state.catalogNotice, /add-on changed/);
  assert.deepEqual(buildProductConfiguration({ product: fresh, ...state }).configuration, { productId, variantId, addonIds: [], quantity: 3 });
  const missing = { ...fresh, status: "hidden", menuStatus: "unavailable" };
  assert.equal(buildProductConfiguration({ product: missing, ...reconcileCustomization(state, missing) }).valid, false);
});
