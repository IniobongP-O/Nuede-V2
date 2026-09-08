import { savedMealIdSchema, savedMealsStorageSchema } from "@nuede/validation/saved-meals";

export const SAVED_MEALS_STORAGE_KEY = "nuede:v2:saved-meals";

/** Resolves an injected storage adapter or the browser's accessible localStorage. */
function browserStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

/** Keeps only unique, structurally valid catalog IDs from untrusted storage data. */
export function normalizeSavedMealIds(value) {
  const list = savedMealsStorageSchema.safeParse(value);
  if (!list.success) return [];

  const uniqueIds = new Set();
  for (const candidate of list.data) {
    const id = savedMealIdSchema.safeParse(candidate);
    if (id.success) uniqueIds.add(id.data);
  }
  return [...uniqueIds];
}

/** Parses a serialized saved-meal list, returning an empty list on corruption. */
export function parseSavedMealIds(serialized) {
  if (serialized === null || serialized === undefined || serialized === "") return [];
  try {
    return normalizeSavedMealIds(JSON.parse(serialized));
  } catch {
    return [];
  }
}

/** Reads and validates saved meals without allowing storage failures to break the UI. */
export function getSavedMealIds(storage) {
  const target = browserStorage(storage);
  if (!target) return [];
  try {
    return parseSavedMealIds(target.getItem(SAVED_MEALS_STORAGE_KEY));
  } catch {
    return [];
  }
}

/** Persists the normalized saved-meal list and reports whether the write succeeded. */
export function setSavedMealIds(ids, storage) {
  const target = browserStorage(storage);
  if (!target) return false;
  try {
    target.setItem(SAVED_MEALS_STORAGE_KEY, JSON.stringify(normalizeSavedMealIds(ids)));
    return true;
  } catch {
    return false;
  }
}

/** Adds one product ID idempotently and returns both the new state and write result. */
export function saveMeal(productId, storage) {
  const ids = getSavedMealIds(storage);
  const nextIds = normalizeSavedMealIds([...ids, productId]);
  return { ids: nextIds, persisted: setSavedMealIds(nextIds, storage) };
}

/** Removes one product ID and returns both the new state and write result. */
export function removeSavedMeal(productId, storage) {
  const nextIds = getSavedMealIds(storage).filter((id) => id !== productId);
  return { ids: nextIds, persisted: setSavedMealIds(nextIds, storage) };
}

/** Clears saved meals and reports whether browser persistence was updated. */
export function clearSavedMeals(storage) {
  const target = browserStorage(storage);
  if (!target) return { ids: [], persisted: false };
  try {
    target.removeItem(SAVED_MEALS_STORAGE_KEY);
    return { ids: [], persisted: true };
  } catch {
    return { ids: [], persisted: false };
  }
}
