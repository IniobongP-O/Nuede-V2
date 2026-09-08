import { createContext, useContext } from "react";

export const SavedMealsContext = createContext(null);

/** Returns the saved-meals API and enforces provider placement. */
export function useSavedMeals() {
  const context = useContext(SavedMealsContext);
  if (!context) throw new Error("useSavedMeals must be used within SavedMealsProvider");
  return context;
}
