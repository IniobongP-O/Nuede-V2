import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SavedMealsContext } from "./savedMealsContext.js";
import {
  clearSavedMeals as clearSavedMealsStorage,
  getSavedMealIds,
  normalizeSavedMealIds,
  parseSavedMealIds,
  SAVED_MEALS_STORAGE_KEY,
  setSavedMealIds,
} from "../storage/savedMealsStorage.js";

export function SavedMealsProvider({ children }) {
  const [savedMealIds, setSavedMealIdsState] = useState(getSavedMealIds);
  const savedMealIdsRef = useRef(savedMealIds);

  const replaceState = useCallback((nextIds) => {
    const normalized = normalizeSavedMealIds(nextIds);
    savedMealIdsRef.current = normalized;
    setSavedMealIdsState(normalized);
    return normalized;
  }, []);

  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== SAVED_MEALS_STORAGE_KEY) return;
      replaceState(parseSavedMealIds(event.newValue));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [replaceState]);

  const saveMeal = useCallback((productId) => {
    const current = savedMealIdsRef.current;
    if (current.includes(productId)) return { changed: false, saved: true, persisted: true };
    const next = normalizeSavedMealIds([...current, productId]);
    if (!next.includes(productId)) return { changed: false, saved: false, persisted: false };
    const persisted = setSavedMealIds(next);
    replaceState(next);
    return { changed: true, saved: true, persisted };
  }, [replaceState]);

  const removeMeal = useCallback((productId) => {
    const current = savedMealIdsRef.current;
    if (!current.includes(productId)) return { changed: false, saved: false, persisted: true };
    const next = current.filter((id) => id !== productId);
    const persisted = setSavedMealIds(next);
    replaceState(next);
    return { changed: true, saved: false, persisted };
  }, [replaceState]);

  const clearSavedMeals = useCallback(() => {
    const changed = savedMealIdsRef.current.length > 0;
    const result = clearSavedMealsStorage();
    replaceState([]);
    return { ...result, changed };
  }, [replaceState]);

  const isSaved = useCallback((productId) => savedMealIds.includes(productId), [savedMealIds]);
  const value = useMemo(() => ({
    savedMealIds,
    savedMealCount: savedMealIds.length,
    isSaved,
    saveMeal,
    removeMeal,
    clearSavedMeals,
  }), [savedMealIds, isSaved, saveMeal, removeMeal, clearSavedMeals]);

  return <SavedMealsContext.Provider value={value}>{children}</SavedMealsContext.Provider>;
}
