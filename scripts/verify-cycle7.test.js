import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { productConfigurationSchema } from "@nuede/validation/customization";
import { normalizeMenuProduct } from "../apps/storefront/src/features/menu/utils/menuModel.js";
import {
  buildProductConfiguration,
  calculateConfiguredDisplayPrice,
  calculateConfiguredItemNutrition,
  getDefaultVariant,
  validateProductConfiguration,
} from "../apps/storefront/src/features/product-detail/utils/customizationModel.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");

const productId = "20000000-0000-4000-8000-000000000001";
const groupId = "20000000-0000-4000-8000-000000000008";
const variantId = "30000000-0000-4000-8000-000000000001";
const otherVariantId = "30000000-0000-4000-8000-000000000002";
const addonId = "40000000-0000-4000-8000-000000000001";
const secondAddonId = "40000000-0000-4000-8000-000000000003";
const unavailableAddonId = "40000000-0000-4000-8000-000000000004";

const standardProduct = {
  id: productId,
  productType: "standard",
  isGrouped: false,
  status: "available",
  menuStatus: "available",
  priceKobo: 850000,
  nutrition: { calories: 610, proteinG: 48, carbohydratesG: 62, fatG: 18 },
  variants: [],
  addons: [
    { id: addonId, name: "Extra protein", priceKobo: 150000, isAvailable: true, nutrition: { calories: 120, proteinG: 24, carbohydratesG: 2, fatG: 3 } },
    { id: secondAddonId, name: "Extra sauce", priceKobo: 80000, isAvailable: true, nutrition: { calories: null, proteinG: null, carbohydratesG: null, fatG: null } },
    { id: unavailableAddonId, name: "Unavailable greens", priceKobo: 120000, isAvailable: false, nutrition: { calories: 70, proteinG: 3, carbohydratesG: 12, fatG: 2 } },
  ],
};

const defaultVariant = {
  id: variantId,
  productId: groupId,
  name: "Rice bowl",
  priceKobo: 700000,
  status: "available",
  isOrderable: true,
  nutrition: { calories: 700, proteinG: 35, carbohydratesG: 80, fatG: 20 },
};

const groupedProduct = {
  id: groupId,
  productType: "grouped",
  isGrouped: true,
  status: "available",
  menuStatus: "available",
  requiresVariantSelection: false,
  defaultVariantId: variantId,
  variants: [defaultVariant, { ...defaultVariant, id: otherVariantId, name: "Pasta", status: "sold_out", isOrderable: false }],
  addons: standardProduct.addons.slice(0, 1),
};

test("Cycle 7 normalizes live add-on relationships and variant detail fields", () => {
  const normalized = normalizeMenuProduct({
    id: groupId,
    category_id: "10000000-0000-4000-8000-000000000001",
    category: { name: "Bowls" },
    product_type: "grouped",
    name: "Choose a bowl",
    slug: "choose-a-bowl",
    description: "A flexible bowl",
    price_kobo: null,
    status: "available",
    requires_variant_selection: false,
    default_variant_id: variantId,
    sort_order: 10,
    product_variants: [{
      id: variantId, product_id: groupId, name: "Rice", description: "Brown rice base", price_kobo: 700000,
      calories: 700, protein_g: 35, carbohydrates_g: 80, fat_g: 20, image_path: "variants/rice.webp", status: "available", sort_order: 10,
    }],
    product_addon_assignments: [{
      addon_id: addonId,
      sort_order: 10,
      addon: { id: addonId, name: "Extra protein", price_kobo: 150000, calories: 120, protein_g: 24, carbohydrates_g: 2, fat_g: 3, is_available: true },
    }],
  }, (imagePath) => `public:${imagePath}`);

  assert.equal(normalized.variants[0].productId, groupId);
  assert.equal(normalized.variants[0].description, "Brown rice base");
  assert.equal(normalized.variants[0].imageUrl, "public:variants/rice.webp");
  assert.equal(normalized.addons[0].id, addonId);
  assert.equal(normalized.addons[0].priceKobo, 150000);
});

test("Cycle 7 builds a normalized standard configuration with stable IDs only", () => {
  const result = buildProductConfiguration({ product: standardProduct, variantId: null, addonIds: [addonId, secondAddonId], quantity: 2 });
  assert.equal(result.valid, true);
  assert.deepEqual(result.configuration, { productId, variantId: null, addonIds: [addonId, secondAddonId], quantity: 2 });
  assert.equal(Object.hasOwn(result.configuration, "total"), false);
  assert.equal(Object.hasOwn(result.configuration, "priceKobo"), false);
  assert.equal(productConfigurationSchema.safeParse(result.configuration).success, true);
});

test("Cycle 7 respects configured defaults and explicit-required selection", () => {
  assert.equal(getDefaultVariant(groupedProduct)?.id, variantId);
  const automatic = buildProductConfiguration({ product: groupedProduct, variantId: getDefaultVariant(groupedProduct)?.id, addonIds: [], quantity: 1 });
  assert.equal(automatic.valid, true);
  assert.equal(automatic.configuration.variantId, variantId);

  const required = { ...groupedProduct, requiresVariantSelection: true, defaultVariantId: null };
  assert.equal(getDefaultVariant(required), null);
  const missing = validateProductConfiguration({ product: required, variantId: null, addonIds: [], quantity: 1 });
  assert.equal(missing.valid, false);
  assert.ok(missing.issues.some((item) => item.code === "variant_required"));
});

test("Cycle 7 rejects invalid, mismatched, hidden, and sold-out variants", () => {
  const mismatched = { ...defaultVariant, id: otherVariantId, productId, name: "Other group" };
  const withMismatch = { ...groupedProduct, variants: [defaultVariant, mismatched] };
  assert.ok(validateProductConfiguration({ product: withMismatch, variantId: otherVariantId, addonIds: [], quantity: 1 }).issues.some((item) => item.code === "variant_product_mismatch"));

  const hidden = { ...defaultVariant, status: "hidden", isOrderable: false };
  assert.ok(validateProductConfiguration({ product: { ...groupedProduct, variants: [hidden] }, variantId, addonIds: [], quantity: 1 }).issues.some((item) => item.code === "invalid_variant"));
  assert.ok(validateProductConfiguration({ product: groupedProduct, variantId: otherVariantId, addonIds: [], quantity: 1 }).issues.some((item) => item.code === "variant_not_orderable"));
  assert.equal(getDefaultVariant({ ...groupedProduct, variants: [{ ...defaultVariant, status: "sold_out", isOrderable: false }] }), null);
});

test("Cycle 7 rejects duplicate, incompatible, and unavailable add-ons", () => {
  assert.ok(validateProductConfiguration({ product: standardProduct, addonIds: [addonId, addonId], quantity: 1 }).issues.some((item) => item.code === "duplicate_addon"));
  assert.ok(validateProductConfiguration({ product: standardProduct, addonIds: ["40000000-0000-4000-8000-000000000099"], quantity: 1 }).issues.some((item) => item.code === "incompatible_addon"));
  assert.ok(validateProductConfiguration({ product: standardProduct, addonIds: [unavailableAddonId], quantity: 1 }).issues.some((item) => item.code === "addon_not_available"));
});

test("Cycle 7 rejects zero, negative, decimal, and non-numeric quantity", () => {
  for (const quantity of [0, -1, 1.5, Number.NaN, "2"]) {
    const result = validateProductConfiguration({ product: standardProduct, addonIds: [], quantity });
    assert.equal(result.valid, false);
    assert.ok(result.issues.some((item) => item.code === "invalid_quantity"));
  }
});

test("Cycle 7 derives integer-kobo display pricing without adding it to identity", () => {
  assert.deepEqual(
    calculateConfiguredDisplayPrice(standardProduct, null, [addonId, secondAddonId], 2),
    { unitPriceKobo: 1080000, linePriceKobo: 2160000, complete: true },
  );
  assert.deepEqual(
    calculateConfiguredDisplayPrice(groupedProduct, variantId, [addonId], 1),
    { unitPriceKobo: 850000, linePriceKobo: 850000, complete: true },
  );
});

test("Cycle 7 nutrition totals preserve known values and mark incomplete components", () => {
  const complete = calculateConfiguredItemNutrition(standardProduct, null, [addonId], 2);
  assert.equal(complete.calories, 1460);
  assert.equal(complete.proteinG, 144);
  assert.equal(complete.isComplete, true);

  const partial = calculateConfiguredItemNutrition(standardProduct, null, [secondAddonId], 1);
  assert.equal(partial.calories, 610);
  assert.equal(partial.caloriesComplete, false);
  assert.equal(partial.isComplete, false);
});

test("Cycle 7 keeps data access centralized and exposes an accessible configuration boundary", async () => {
  const api = await read("apps/storefront/src/features/menu/api/menuApi.js");
  const page = await read("apps/storefront/src/pages/MenuPage.jsx");
  const dialog = await read("apps/storefront/src/features/product-detail/components/ProductDetailDialog.jsx");
  const primitive = await read("apps/storefront/src/components/ui/Dialog.jsx");
  const realtime = await read("apps/storefront/src/features/menu/hooks/useMenuRealtime.js");
  const migration = await read("supabase/migrations/20260901000300_enable_customization_catalog_realtime.sql");
  assert.match(api, /product_addon_assignments/);
  assert.match(api, /product_variants!product_variants_product_fk/);
  assert.doesNotMatch(`${page}\n${dialog}`, /supabase|\.from\("/);
  assert.match(dialog, /onConfigured/);
  assert.match(dialog, /type="radio"/);
  assert.match(dialog, /type="checkbox"/);
  assert.match(primitive, /showModal/);
  assert.match(primitive, /onCancel/);
  assert.match(primitive, /openerRef/);
  assert.match(primitive, /queueMicrotask/);
  assert.match(realtime, /product_addons/);
  assert.match(realtime, /product_addon_assignments/);
  assert.match(migration, /alter publication supabase_realtime add table public\.product_addons/);
  assert.match(migration, /alter publication supabase_realtime add table public\.product_addon_assignments/);
  assert.doesNotMatch(migration, /grant\s+(select|insert|update|delete)/i);
});
