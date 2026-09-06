import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  addCartItem,
  canonicalizeAddonIds,
  createCartItemKey,
  decrementCartItem,
  getCartItemCount,
  incrementCartItem,
  isSameCartConfiguration,
  normalizeCartItems,
  removeCartItem,
  replaceCartItem,
  setCartItemQuantity,
} from "@nuede/domain/cart";
import { NUTRITION_STATUS } from "@nuede/domain/nutrition";
import {
  CART_STORAGE_KEY,
  clearCartItems,
  getCartItems,
  normalizeStoredCartItems,
  parseCartItems,
  setCartItems,
} from "../apps/storefront/src/features/cart/storage/cartStorage.js";
import {
  calculateCartSubtotal,
  calculateHydratedCartNutrition,
  CART_ITEM_STATUS,
  hydrateCartItems,
} from "../apps/storefront/src/features/cart/utils/cartModel.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");
const productId = "20000000-0000-4000-8000-000000000001";
const groupId = "20000000-0000-4000-8000-000000000008";
const variantAId = "30000000-0000-4000-8000-000000000001";
const variantBId = "30000000-0000-4000-8000-000000000002";
const addonAId = "40000000-0000-4000-8000-000000000001";
const addonBId = "40000000-0000-4000-8000-000000000002";

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const standardProduct = Object.freeze({
  id: productId,
  name: "Chicken bowl",
  isGrouped: false,
  status: "available",
  menuStatus: "available",
  priceKobo: 800000,
  nutrition: { calories: 500, proteinG: 40, carbohydratesG: 50, fatG: 15 },
  variants: [],
  addons: [
    { id: addonAId, name: "Extra chicken", priceKobo: 100000, isAvailable: true, nutrition: { calories: 100, proteinG: 10, carbohydratesG: 5, fatG: 2 } },
    { id: addonBId, name: "Extra vegetables", priceKobo: 50000, isAvailable: true, nutrition: { calories: 50, proteinG: 5, carbohydratesG: 10, fatG: 1 } },
  ],
});

const variants = [
  { id: variantAId, productId: groupId, name: "Rice", status: "available", isOrderable: true, priceKobo: 700000, nutrition: { calories: 600, proteinG: 35, carbohydratesG: 70, fatG: 18 } },
  { id: variantBId, productId: groupId, name: "Pasta", status: "available", isOrderable: true, priceKobo: 750000, nutrition: { calories: 650, proteinG: 38, carbohydratesG: 75, fatG: 19 } },
];
const groupedProduct = Object.freeze({ ...standardProduct, id: groupId, name: "Choose a bowl", isGrouped: true, priceKobo: null, variants });

function configuration(overrides = {}) {
  return { productId, variantId: null, addonIds: [], quantity: 1, ...overrides };
}

test("Cycle 9 canonicalizes add-ons and excludes quantity from cart identity", () => {
  assert.deepEqual(canonicalizeAddonIds([addonBId, addonAId, addonBId]), [addonAId, addonBId]);
  const first = configuration({ addonIds: [addonAId, addonBId], quantity: 1 });
  const reordered = configuration({ addonIds: [addonBId, addonAId], quantity: 9 });
  assert.equal(createCartItemKey(first), createCartItemKey(reordered));
  assert.equal(isSameCartConfiguration(first, reordered), true);
  assert.notEqual(createCartItemKey(first), createCartItemKey(configuration({ addonIds: [addonAId] })));
  assert.notEqual(
    createCartItemKey(configuration({ productId: groupId, variantId: variantAId })),
    createCartItemKey(configuration({ productId: groupId, variantId: variantBId })),
  );
});

test("Cycle 9 merges exact configurations and applies safe quantity operations", () => {
  const key = createCartItemKey(configuration({ addonIds: [addonAId] }));
  let items = addCartItem([], configuration({ addonIds: [addonAId], quantity: 1 }));
  items = addCartItem(items, configuration({ addonIds: [addonAId], quantity: 2 }));
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 3);
  items = incrementCartItem(items, key);
  assert.equal(items[0].quantity, 4);
  items = decrementCartItem(items, key);
  assert.equal(items[0].quantity, 3);
  assert.equal(decrementCartItem([configuration()], createCartItemKey(configuration()))[0].quantity, 1);
  assert.equal(setCartItemQuantity(items, key, 1.5)[0].quantity, 3);
  assert.equal(removeCartItem(items, key).length, 0);
});

test("Cycle 9 keeps differing variants/add-ons separate and merges on reconfiguration", () => {
  const variantA = configuration({ productId: groupId, variantId: variantAId, addonIds: [addonAId] });
  const variantB = configuration({ productId: groupId, variantId: variantBId });
  const otherAddon = configuration({ productId: groupId, variantId: variantAId, addonIds: [addonBId] });
  const items = normalizeCartItems([variantA, variantB, otherAddon]);
  assert.equal(items.length, 3);
  const replaced = replaceCartItem(items, createCartItemKey(otherAddon), { ...variantA, quantity: 2 });
  assert.equal(replaced.length, 2);
  assert.equal(replaced.find((item) => isSameCartConfiguration(item, variantA)).quantity, 3);
  assert.equal(getCartItemCount(replaced), 4);
});

test("Cycle 9 validates, normalizes, persists, restores, and clears untrusted storage", () => {
  assert.equal(CART_STORAGE_KEY, "nuede:v2:cart");
  assert.deepEqual(parseCartItems("not json"), []);
  assert.deepEqual(parseCartItems("{}"), []);
  assert.deepEqual(normalizeStoredCartItems({ version: 99, items: [] }), []);
  assert.deepEqual(normalizeStoredCartItems({ version: 1, items: [configuration({ quantity: -5 }), { productId: "bad", variantId: null, addonIds: [], quantity: 1 }] }), []);

  const duplicateStorage = { version: 1, items: [configuration({ addonIds: [addonBId, addonAId], quantity: 1 }), configuration({ addonIds: [addonAId, addonBId], quantity: 2 })] };
  const normalized = normalizeStoredCartItems(duplicateStorage);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].quantity, 3);
  assert.deepEqual(normalized[0].addonIds, [addonAId, addonBId]);

  const storage = new MemoryStorage();
  assert.equal(setCartItems(normalized, storage), true);
  assert.equal(JSON.parse(storage.getItem(CART_STORAGE_KEY)).version, 1);
  assert.deepEqual(getCartItems(storage), normalized);
  assert.equal(clearCartItems(storage).persisted, true);
  assert.equal(storage.getItem(CART_STORAGE_KEY), null);
});

test("Cycle 9 hydrates display price and nutrition from the current catalog", () => {
  const [item] = hydrateCartItems([configuration({ addonIds: [addonAId, addonBId], quantity: 2 })], [standardProduct]);
  assert.equal(item.status, CART_ITEM_STATUS.valid);
  assert.equal(item.price.unitPriceKobo, 950000);
  assert.equal(item.price.linePriceKobo, 1900000);
  assert.equal(item.nutrition.calories, 1300);
  assert.equal(item.nutrition.proteinG, 110);
  assert.equal(calculateCartSubtotal([item]).subtotalKobo, 1900000);
  assert.equal(calculateHydratedCartNutrition([item]).status, NUTRITION_STATUS.complete);
});

test("Cycle 9 preserves grouped selection identity and current variant data", () => {
  const hydrated = hydrateCartItems([
    configuration({ productId: groupId, variantId: variantAId }),
    configuration({ productId: groupId, variantId: variantBId }),
  ], [groupedProduct]);
  assert.deepEqual(hydrated.map((item) => item.variant.name), ["Rice", "Pasta"]);
  assert.deepEqual(hydrated.map((item) => item.price.unitPriceKobo), [700000, 750000]);
  assert.equal(calculateCartSubtotal(hydrated).subtotalKobo, 1450000);
});

test("Cycle 9 safely marks stale products, variants, sold-out lines, and invalid add-ons", () => {
  const [stale] = hydrateCartItems([configuration()], []);
  assert.equal(stale.status, CART_ITEM_STATUS.stale);
  assert.equal(stale.product, null);
  assert.equal(stale.price.complete, false);

  const [missingVariant] = hydrateCartItems([configuration({ productId: groupId, variantId: "30000000-0000-4000-8000-000000000099" })], [groupedProduct]);
  assert.equal(missingVariant.status, CART_ITEM_STATUS.invalidVariant);

  const soldOutGroup = { ...groupedProduct, variants: [{ ...variants[0], status: "sold_out", isOrderable: false }] };
  const [soldOut] = hydrateCartItems([configuration({ productId: groupId, variantId: variantAId })], [soldOutGroup]);
  assert.equal(soldOut.status, CART_ITEM_STATUS.soldOut);
  assert.equal(soldOut.orderable, false);

  const pendingGroup = { ...groupedProduct, variants: [{ ...variants[0], priceKobo: null, isOrderable: false }] };
  const [pricePending] = hydrateCartItems([configuration({ productId: groupId, variantId: variantAId })], [pendingGroup]);
  assert.equal(pricePending.status, CART_ITEM_STATUS.pricePending);
  assert.equal(pricePending.price.complete, false);

  const unavailableAddonProduct = { ...standardProduct, addons: [{ ...standardProduct.addons[0], isAvailable: false }] };
  const [invalidAddon] = hydrateCartItems([configuration({ addonIds: [addonAId] })], [unavailableAddonProduct]);
  assert.equal(invalidAddon.status, CART_ITEM_STATUS.invalidAddon);

  const [removedAddon] = hydrateCartItems([configuration({ addonIds: [addonAId] })], [{ ...standardProduct, addons: [] }]);
  assert.equal(removedAddon.status, CART_ITEM_STATUS.invalidAddon);
  assert.equal(removedAddon.price.complete, false);
  assert.equal(removedAddon.nutrition.status, NUTRITION_STATUS.partial);
});

test("Cycle 9 architecture keeps selections local, display data live, and future-cycle boundaries intact", async () => {
  const storage = await read("apps/storefront/src/features/cart/storage/cartStorage.js");
  const provider = await read("apps/storefront/src/features/cart/context/CartProvider.jsx");
  const dialog = await read("apps/storefront/src/features/cart/components/CartDialog.jsx");
  const header = await read("apps/storefront/src/components/layout/StorefrontHeader.jsx");
  const menu = await read("apps/storefront/src/pages/MenuPage.jsx");
  const migrations = await read("supabase/migrations/README.md");
  assert.match(provider, /addEventListener\("storage"/);
  assert.match(dialog, /useMenu\(\)/);
  assert.match(dialog, /confirm current prices and your final total at checkout/);
  assert.match(dialog, /Delivery is calculated at checkout/);
  assert.match(header, /itemCount/);
  assert.match(header, /Open basket/);
  assert.match(menu, /addItem\(configuration\)/);
  assert.doesNotMatch(storage, /price|nutrition|productName|image/);
  assert.doesNotMatch(`${provider}\n${dialog}`, /service.role|createOrder|order_items|Paystack|WhatsApp/i);
  assert.doesNotMatch(migrations, /create table public\.(carts|cart_items|customer_cart)/i);
});
