import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  filterMenuProducts,
  HIGH_PROTEIN_MINIMUM_GRAMS,
  normalizeMenuProduct,
} from "../apps/storefront/src/features/menu/utils/menuModel.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");

const category = { id: "category-main", name: "Main Meals", slug: "main-meals", is_enabled: true, sort_order: 10 };
const standardRow = {
  id: "standard-one", category_id: category.id, category, product_type: "standard", name: "Citrus Chicken",
  slug: "citrus-chicken", description: "Bright grilled chicken", price_kobo: 850000, calories: 610,
  protein_g: 48, carbohydrates_g: 62, fat_g: 18, image_path: "products/one/image.webp", status: "available",
  requires_variant_selection: false, default_variant_id: null, sort_order: 10, product_variants: [],
};

test("Cycle 6 normalizes standard products without losing kobo, nutrition, or Storage paths", () => {
  const product = normalizeMenuProduct(standardRow, (imagePath) => `public:${imagePath}`);
  assert.equal(product.priceKobo, 850000);
  assert.equal(product.imageUrl, "public:products/one/image.webp");
  assert.equal(product.isOrderable, true);
  assert.equal(product.hasCompleteNutrition, true);
  assert.equal(product.isHighProtein, true);
  assert.equal(HIGH_PROTEIN_MINIMUM_GRAMS, 30);
});

test("Cycle 6 derives grouped menu state and price from public variants", () => {
  const group = {
    ...standardRow,
    id: "group-one", product_type: "grouped", name: "Choose Your Bowl", price_kobo: null,
    calories: null, protein_g: null, carbohydrates_g: null, fat_g: null,
    requires_variant_selection: true, default_variant_id: null,
    product_variants: [
      { id: "variant-hidden", product_id: "group-one", name: "Hidden", status: "hidden", price_kobo: 500000, sort_order: 5 },
      { id: "variant-sold", product_id: "group-one", name: "Pasta", status: "sold_out", price_kobo: 900000, sort_order: 20 },
      { id: "variant-live", product_id: "group-one", name: "Rice", status: "available", price_kobo: 750000, calories: 700, protein_g: 35, carbohydrates_g: 80, fat_g: 20, sort_order: 10 },
    ],
  };
  const product = normalizeMenuProduct(group);
  assert.equal(product.menuStatus, "available");
  assert.equal(product.variantCount, 2);
  assert.equal(product.orderableVariantCount, 1);
  assert.equal(product.priceKobo, 750000);
  assert.equal(product.pricePrefix, "From ");

  const soldOut = normalizeMenuProduct({ ...group, product_variants: group.product_variants.map((variant) => variant.status === "available" ? { ...variant, status: "sold_out" } : variant) });
  assert.equal(soldOut.menuStatus, "sold_out");
  assert.equal(soldOut.isOrderable, false);

  const unavailable = normalizeMenuProduct({ ...group, product_variants: group.product_variants.map((variant) => ({ ...variant, status: "unavailable" })) });
  assert.equal(unavailable.menuStatus, "unavailable");
  assert.equal(unavailable.priceKobo, null);
});

test("Cycle 6 search and filters compose as deterministic intersections", () => {
  const main = normalizeMenuProduct(standardRow);
  const side = normalizeMenuProduct({ ...standardRow, id: "side-one", category_id: "category-side", category: { id: "category-side", name: "Sides" }, name: "Garden Greens", protein_g: 5 });
  const pending = normalizeMenuProduct({ ...standardRow, id: "pending-one", name: "Seasonal Plate", price_kobo: null, status: "price_pending" });
  const products = [main, side, pending];
  assert.deepEqual(filterMenuProducts(products, { search: "MAIN MEALS" }).map((item) => item.id), ["standard-one", "pending-one"]);
  assert.deepEqual(filterMenuProducts(products, { search: "bright", categoryId: category.id, filters: ["available", "high-protein", "complete-nutrition"] }).map((item) => item.id), ["standard-one"]);
  assert.deepEqual(filterMenuProducts(products, { categoryId: "category-side", filters: ["high-protein"] }), []);
});

test("Cycle 6 centralizes Supabase access and uses TanStack Query plus selective Realtime invalidation", async () => {
  const api = await read("apps/storefront/src/features/menu/api/menuApi.js");
  const hooks = await read("apps/storefront/src/features/menu/hooks/useMenu.js");
  const realtime = await read("apps/storefront/src/features/menu/hooks/useMenuRealtime.js");
  const visualFiles = [
    await read("apps/storefront/src/pages/MenuPage.jsx"),
    await read("apps/storefront/src/features/menu/components/MenuProductCard.jsx"),
    await read("apps/storefront/src/features/menu/components/MenuControls.jsx"),
  ].join("\n");
  assert.match(api, /\.from\("categories"\)/);
  assert.match(api, /\.from\("products"\)/);
  assert.match(api, /categories!inner/);
  assert.match(hooks, /useQuery/);
  assert.match(realtime, /product_variants/);
  assert.match(realtime, /createCatalogInvalidator\(queryClient, menuQueryKeys\)/);
  assert.match(await read("apps/storefront/src/features/menu/utils/catalogInvalidation.js"), /invalidateQueries/);
  assert.match(realtime, /removeChannel/);
  assert.doesNotMatch(visualFiles, /supabase|\.from\("/);
});

test("Cycle 6 keeps hidden and archived rows outside the storefront query contract", async () => {
  const api = await read("apps/storefront/src/features/menu/api/menuApi.js");
  const migration = await read("supabase/migrations/20260901000200_enable_storefront_catalog_realtime.sql");
  assert.match(api, /publicProductStatuses/);
  assert.doesNotMatch(api.match(/const publicProductStatuses = \[[^;]+/s)?.[0] || "", /hidden|archived/);
  assert.match(migration, /supabase_realtime/);
  assert.match(migration, /public\.categories/);
  assert.match(migration, /public\.products/);
  assert.match(migration, /public\.product_variants/);
  assert.doesNotMatch(migration, /grant\s+(select|insert|update|delete)/i);
});
