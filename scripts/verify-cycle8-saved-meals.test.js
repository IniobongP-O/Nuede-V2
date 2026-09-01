import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { selectSavedProducts } from "../apps/storefront/src/features/saved-meals/utils/savedMealsModel.js";
import {
  clearSavedMeals,
  getSavedMealIds,
  normalizeSavedMealIds,
  parseSavedMealIds,
  removeSavedMeal,
  SAVED_MEALS_STORAGE_KEY,
  saveMeal,
} from "../apps/storefront/src/features/saved-meals/storage/savedMealsStorage.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");
const firstId = "20000000-0000-4000-8000-000000000001";
const secondId = "20000000-0000-4000-8000-000000000008";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

test("Cycle 8 validates, deduplicates, and safely recovers Saved Meals browser data", () => {
  assert.equal(SAVED_MEALS_STORAGE_KEY, "nuede:v2:saved-meals");
  assert.deepEqual(parseSavedMealIds(null), []);
  assert.deepEqual(parseSavedMealIds("not json"), []);
  assert.deepEqual(parseSavedMealIds("{}"), []);
  assert.deepEqual(parseSavedMealIds(JSON.stringify([firstId, firstId, "not-a-uuid", 42, secondId])), [firstId, secondId]);
  assert.deepEqual(normalizeSavedMealIds([secondId, firstId, secondId]), [secondId, firstId]);
});

test("Cycle 8 saves stable product IDs, persists removal, and clears the namespaced key", () => {
  const storage = new MemoryStorage();
  assert.deepEqual(getSavedMealIds(storage), []);

  assert.equal(saveMeal(firstId, storage).persisted, true);
  assert.equal(saveMeal(secondId, storage).persisted, true);
  assert.equal(saveMeal(firstId, storage).persisted, true);
  assert.deepEqual(getSavedMealIds(storage), [firstId, secondId]);
  assert.deepEqual(JSON.parse(storage.getItem(SAVED_MEALS_STORAGE_KEY)), [firstId, secondId]);

  assert.equal(removeSavedMeal(firstId, storage).persisted, true);
  assert.deepEqual(getSavedMealIds(storage), [secondId]);

  assert.equal(clearSavedMeals(storage).persisted, true);
  assert.equal(storage.getItem(SAVED_MEALS_STORAGE_KEY), null);
  assert.deepEqual(getSavedMealIds(storage), []);
});

test("Cycle 8 saved view models use public live products only and preserve grouped/state data", () => {
  const liveStandard = { id: firstId, name: "Live standard", menuStatus: "sold_out", priceKobo: 850000 };
  const liveGroup = { id: secondId, name: "Live group", isGrouped: true, variants: [{ id: "variant-live" }], menuStatus: "price_pending", priceKobo: null };
  const selected = selectSavedProducts([secondId, "20000000-0000-4000-8000-000000000099", firstId], [liveStandard, liveGroup]);
  assert.deepEqual(selected, [liveGroup, liveStandard]);
  assert.equal(selected[0].isGrouped, true);
  assert.equal(selected[0].menuStatus, "price_pending");
  assert.equal(selected[1].menuStatus, "sold_out");
});

test("Cycle 8 keeps persistence centralized and Saved Meals tied to the live query architecture", async () => {
  const storage = await read("apps/storefront/src/features/saved-meals/storage/savedMealsStorage.js");
  const provider = await read("apps/storefront/src/features/saved-meals/context/SavedMealsProvider.jsx");
  const favoriteButton = await read("apps/storefront/src/features/saved-meals/components/FavoriteButton.jsx");
  const card = await read("apps/storefront/src/features/menu/components/MenuProductCard.jsx");
  const detail = await read("apps/storefront/src/features/product-detail/components/ProductDetailDialog.jsx");
  const page = await read("apps/storefront/src/pages/SavedPage.jsx");
  const layout = await read("apps/storefront/src/components/layout/StorefrontLayout.jsx");

  assert.match(storage, /nuede:v2:saved-meals/);
  assert.match(provider, /addEventListener\("storage"/);
  assert.match(provider, /removeEventListener\("storage"/);
  assert.match(favoriteButton, /aria-pressed/);
  assert.match(favoriteButton, /Remove \$\{productName\} from saved meals/);
  assert.match(card, /FavoriteButton/);
  assert.match(detail, /FavoriteButton/);
  assert.match(page, /useMenu\(\)/);
  assert.match(layout, /useMenuRealtime\(\)/);
  assert.match(page, /ProductDetailDialog/);
  assert.match(page, /Clear all saved meals/);
  assert.doesNotMatch(`${card}\n${detail}\n${page}`, /localStorage|\.from\("|supabase/);
  assert.doesNotMatch(storage, /price|nutrition|image|productName/);
});

test("Cycle 8 remains separate from customer accounts, planner state, and a favorites table", async () => {
  const page = await read("apps/storefront/src/pages/SavedPage.jsx");
  const layout = await read("apps/storefront/src/components/layout/StorefrontLayout.jsx");
  const schema = await read("supabase/migrations/20260831000100_create_database_foundation.sql");
  assert.match(layout, /SavedMealsProvider/);
  assert.doesNotMatch(`${page}\n${layout}`, /customerAuth|PlannerProvider/);
  assert.doesNotMatch(schema, /create table public\.(favorites|saved_meals)/i);
});
