import { createContext, useContext } from "react";

export const SavedMealsContext = createContext(null);

export function useSavedMeals() {
  const context = useContext(SavedMealsContext);
  if (!context) throw new Error("useSavedMeals must be used within SavedMealsProvider");
  return context;
}
