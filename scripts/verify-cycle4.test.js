import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { formatKobo, koboToNairaInput } from "@nuede/domain/currency";
import { parseNairaToKobo, productFormSchema } from "@nuede/validation/catalog";

import {
  filterProducts,
  nextProductStatus,
  productFormToRecord,
} from "../apps/admin/src/features/catalog/utils/catalogUtils.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return readFile(path.join(repositoryRoot, relativePath), "utf8");
}

const validForm = {
  name: "Cycle Four Bowl",
  categoryId: "10000000-0000-4000-8000-000000000001",
  description: "A complete standard meal.",
  priceNgn: "6500",
  calories: "610",
  protein: "48.5",
  carbohydrates: "62",
  fat: "18",
  availability: "available",
  visibility: "shown",
};

test("Cycle 4 converts NGN text to integer kobo without floating-point money", () => {
  assert.equal(parseNairaToKobo("6500"), 650000);
  assert.equal(parseNairaToKobo("6500.05"), 650005);
  assert.equal(formatKobo(650000), "₦6,500");
  assert.equal(koboToNairaInput(650005), "6500.05");
  assert.throws(() => parseNairaToKobo("12.345"));
  assert.throws(() => parseNairaToKobo("-1"));
});

test("Cycle 4 product validation preserves price and optional nutrition rules", () => {
  assert.equal(productFormSchema.safeParse(validForm).success, true);
  assert.equal(productFormSchema.safeParse({ ...validForm, priceNgn: "", availability: "available" }).success, false);
  assert.equal(productFormSchema.safeParse({ ...validForm, priceNgn: "100", availability: "price_pending" }).success, false);
  assert.equal(productFormSchema.safeParse({ ...validForm, protein: "-1" }).success, false);

  const record = productFormToRecord({
    ...validForm,
    calories: "",
    carbohydrates: "",
    visibility: "hidden",
  });
  assert.equal(record.price_kobo, 650000);
  assert.equal(record.calories, null);
  assert.equal(record.carbohydrates_g, null);
  assert.equal(record.status, "hidden");
  assert.equal(record.product_type, "standard");
});

test("Cycle 4 search, category and status filters compose", () => {
  const products = [
    { id: "1", name: "Citrus Chicken", category_id: "a", status: "available" },
    { id: "2", name: "Beef Bowl", category_id: "b", status: "sold_out" },
    { id: "3", name: "Chicken Curry", category_id: "a", status: "hidden" },
  ];
  assert.deepEqual(filterProducts(products, { search: "chicken", category: "a", status: "available" }).map((item) => item.id), ["1"]);
  assert.deepEqual(filterProducts(products, { search: "", category: "all", status: "sold_out" }).map((item) => item.id), ["2"]);
});

test("Cycle 4 status transitions protect price integrity and restore safely", () => {
  const priced = { price_kobo: 650000 };
  const unpriced = { price_kobo: null };
  assert.equal(nextProductStatus(priced, "mark_sold_out"), "sold_out");
  assert.equal(nextProductStatus(priced, "show"), "available");
  assert.equal(nextProductStatus(unpriced, "show"), "price_pending");
  assert.equal(nextProductStatus(priced, "archive"), "archived");
  assert.equal(nextProductStatus(priced, "restore"), "hidden");
  assert.throws(() => nextProductStatus(unpriced, "mark_available"));
});

test("Cycle 4 centralizes catalog data access and uses TanStack Query invalidation", async () => {
  const api = await read("apps/admin/src/features/catalog/api/catalogApi.js");
  const hooks = await read("apps/admin/src/features/catalog/hooks/useCatalog.js");
  const page = await read("apps/admin/src/pages/MenuPage.jsx");
  assert.match(api, /\.from\("categories"\)/);
  assert.match(api, /\.from\("products"\)/);
  assert.match(api, /\.eq\("product_type", "standard"\)/);
  assert.match(hooks, /useQuery/);
  assert.match(hooks, /invalidateQueries/);
  assert.doesNotMatch(page, /supabase\.from|\.from\("products"\)/);
});

test("Cycle 4 audit migration records trusted product events without client audit grants", async () => {
  const migration = await read("supabase/migrations/20260831000300_audit_admin_catalog_changes.sql");
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = ''/);
  assert.match(migration, /product_created/);
  assert.match(migration, /product_price_changed/);
  assert.match(migration, /product_archived/);
  assert.match(migration, /product_restored/);
  assert.doesNotMatch(migration, /grant insert[^;]*admin_audit_log[^;]*authenticated/is);
});

test("Cycle 4 remains inside standard catalog scope", async () => {
  const files = [
    await read("apps/admin/src/pages/MenuPage.jsx"),
    await read("apps/admin/src/features/catalog/components/ProductEditorDialog.jsx"),
    await read("apps/admin/src/features/catalog/api/catalogApi.js"),
  ].join("\n");
  assert.doesNotMatch(files, /storage\.from|upload\(|product_variants|product_addons|createGrouped/i);
  assert.doesNotMatch(files, /\.delete\(\)/);
});
