import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  groupedProductOrderabilityMessage,
  isOrderableVariant,
  moveVariantIds,
} from "@nuede/domain/catalog";
import {
  addonFormSchema,
  catalogImageMaximumBytes,
  catalogImageValidationMessage,
  groupedProductFormSchema,
  variantFormSchema,
} from "@nuede/validation/catalog";

import {
  addonFormToRecord,
  groupedProductFormToRecord,
  variantFormToRecord,
} from "../apps/admin/src/features/catalog/utils/catalogUtils.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");
const groupId = "20000000-0000-4000-8000-000000000008";
const otherGroupId = "70000000-0000-4000-8000-000000000003";
const categoryId = "10000000-0000-4000-8000-000000000003";
const variantA = { id: "30000000-0000-4000-8000-000000000001", product_id: groupId, status: "available", price_kobo: 650000, sort_order: 10 };
const variantB = { id: "30000000-0000-4000-8000-000000000002", product_id: groupId, status: "sold_out", price_kobo: 700000, sort_order: 20 };

test("Cycle 5 grouped orderability requires a valid visible priced variant", () => {
  const group = { id: groupId, product_type: "grouped", status: "available", requires_variant_selection: true, default_variant_id: null };
  assert.match(groupedProductOrderabilityMessage(group, []), /at least one/i);
  assert.match(groupedProductOrderabilityMessage(group, [{ ...variantA, status: "hidden" }]), /at least one/i);
  assert.match(groupedProductOrderabilityMessage(group, [variantB]), /at least one/i);
  assert.equal(groupedProductOrderabilityMessage(group, [variantA]), null);
  assert.match(groupedProductOrderabilityMessage(group, [{ ...variantA, product_id: otherGroupId }]), /at least one/i);
  assert.equal(isOrderableVariant({ ...variantA, price_kobo: 650000.5 }), false);
});

test("Cycle 5 default selection rejects missing and cross-group defaults", () => {
  const automatic = { id: groupId, product_type: "grouped", status: "available", requires_variant_selection: false };
  assert.match(groupedProductOrderabilityMessage({ ...automatic, default_variant_id: otherGroupId }, [variantA]), /default variant/i);
  assert.equal(groupedProductOrderabilityMessage({ ...automatic, default_variant_id: variantA.id }, [variantA]), null);

  const baseForm = {
    name: "Grouped test",
    categoryId,
    description: "",
    availability: "available",
    visibility: "shown",
    selectionMode: "automatic",
    defaultVariantId: "",
    addonIds: [],
  };
  assert.equal(groupedProductFormSchema.safeParse(baseForm).success, false);
  assert.equal(groupedProductFormSchema.safeParse({ ...baseForm, defaultVariantId: variantA.id }).success, true);
  const requiredSelection = groupedProductFormSchema.parse({ ...baseForm, selectionMode: "required", defaultVariantId: variantA.id });
  assert.equal(groupedProductFormToRecord(requiredSelection).default_variant_id, null);
});

test("Cycle 5 variant mapping preserves integer-kobo prices and stable reorder IDs", () => {
  const form = {
    name: "Rice",
    description: "Variant description",
    priceNgn: "6500.05",
    calories: "500",
    protein: "30.5",
    carbohydrates: "60",
    fat: "12",
    availability: "available",
    visibility: "shown",
    sortOrder: "20",
  };
  assert.equal(variantFormSchema.safeParse(form).success, true);
  const record = variantFormToRecord(form);
  assert.equal(record.price_kobo, 650005);
  assert.equal(Number.isSafeInteger(record.price_kobo), true);
  assert.equal(record.status, "available");
  assert.deepEqual(moveVariantIds([variantA, variantB], variantB.id, "up"), [variantB.id, variantA.id]);
  assert.deepEqual(new Set(moveVariantIds([variantA, variantB], variantB.id, "up")), new Set([variantA.id, variantB.id]));
});

test("Cycle 5 add-on forms preserve availability, nutrition, and integer kobo", () => {
  const form = { name: "Extra protein", priceNgn: "1250", calories: "90", protein: "18", carbohydrates: "2", fat: "1", isAvailable: false };
  assert.equal(addonFormSchema.safeParse(form).success, true);
  const record = addonFormToRecord(form);
  assert.equal(record.price_kobo, 125000);
  assert.equal(record.is_available, false);
  assert.equal(record.protein_g, 18);
});

test("Cycle 5 grouped form maps parent fields without inventing a parent price", () => {
  const record = groupedProductFormToRecord({
    name: "Family meal",
    categoryId,
    description: "Choose a base",
    availability: "sold_out",
    visibility: "shown",
    selectionMode: "required",
    defaultVariantId: "",
    addonIds: [],
  });
  assert.equal(record.product_type, "grouped");
  assert.equal(record.price_kobo, null);
  assert.equal(record.status, "sold_out");
  assert.equal(record.requires_variant_selection, true);
  assert.equal(record.default_variant_id, null);
});

test("Cycle 5 image validation accepts supported files and rejects invalid inputs", () => {
  assert.equal(catalogImageValidationMessage({ type: "image/jpeg", size: 1000 }), null);
  assert.match(catalogImageValidationMessage({ type: "application/pdf", size: 1000 }), /JPEG/i);
  assert.match(catalogImageValidationMessage({ type: "image/png", size: catalogImageMaximumBytes + 1 }), /5 MB/i);
  assert.match(catalogImageValidationMessage({ type: "image/webp", size: 0 }), /empty/i);
});

test("Cycle 5 centralizes Storage writes and uses safe replacement ordering", async () => {
  const api = await read("apps/admin/src/features/catalog/api/catalogApi.js");
  const imageApi = await read("apps/admin/src/features/catalog/api/imageApi.js");
  const page = await read("apps/admin/src/pages/MenuPage.jsx");
  const standardEditor = await read("apps/admin/src/features/catalog/components/ProductEditorDialog.jsx");
  const variantEditor = await read("apps/admin/src/features/catalog/components/VariantEditorDialog.jsx");
  assert.match(imageApi, /\.storage/);
  assert.match(imageApi, /prepareCatalogImage/);
  assert.match(imageApi, /1600/);
  assert.ok(api.indexOf("await uploadCatalogImage") < api.indexOf("image_path: imagePath"));
  assert.ok(api.indexOf("image_path: imagePath") < api.lastIndexOf("removeCatalogImage(existingImagePath)"));
  assert.match(api, /uploadedPath && !productPersisted/);
  assert.match(api, /uploadedPath && productPersisted && existingImagePath/);
  assert.match(standardEditor, /setError\("root"/);
  assert.match(variantEditor, /setError\("root"/);
  assert.doesNotMatch(page, /\.storage|supabase\.from|\.from\("products"\)/);
});

test("Cycle 5 migration owns bucket policies, group safeguards, atomic helpers, and audit extensions", async () => {
  const migration = await read("supabase/migrations/20260901000100_complete_catalog_images_variants_addons.sql");
  assert.match(migration, /insert into storage\.buckets/);
  assert.match(migration, /product_images_active_admin_insert/);
  assert.match(migration, /private\.is_active_admin/);
  assert.match(migration, /grouped_product_requires_orderable_variant/);
  assert.match(migration, /grouped_product_default_variant_must_remain_orderable/);
  assert.match(migration, /reorder_product_variants/);
  assert.match(migration, /replace_product_addon_assignments/);
  assert.match(migration, /variant_price_changed/);
  assert.match(migration, /addon_updated/);
  assert.doesNotMatch(migration, /grant (insert|update|delete)[^;]*storage\.objects[^;]*anon/is);
});

test("Cycle 5 preserves its historical Cycle 6 boundary in project traceability", async () => {
  const features = await read("docs/FEATURES.md");
  assert.match(features, /Deliberately not implemented in Cycle 5:[\s\S]*live storefront Supabase catalog queries or Realtime subscriptions \(Cycle 6\)/);
});
