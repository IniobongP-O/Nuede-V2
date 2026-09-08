import { useCallback, useEffect, useRef, useState } from "react";

import {
  PLANNER_STORAGE_KEY,
  getStoredPlan,
  parseStoredPlan,
  setStoredPlan,
} from "../storage/plannerStorage.js";
import {
  clearPlan,
  moveSlotMeal,
  quickAddMeal,
  removeSlotMeal,
  resizePlan,
  setSlotMeal,
} from "../utils/plannerModel.js";

/**
 * Owns the editable meal plan and persists every successful transition locally.
 * Returned actions always operate on the latest ref so rapid updates do not use stale React state.
 */
export function usePlanner() {
  const [plan, setPlanState] = useState(getStoredPlan);
  const [persistenceAvailable, setPersistenceAvailable] = useState(true);
  const planRef = useRef(plan);

  /** Replaces the synchronous ref and rendered state as one transition. */
  const replaceState = useCallback((nextPlan) => {
    planRef.current = nextPlan;
    setPlanState(nextPlan);
    return nextPlan;
  }, []);

  /** Applies a plan transition, persists it, and exposes storage availability. */
  const commit = useCallback((nextPlan) => {
    const next = replaceState(nextPlan);
    const persisted = setStoredPlan(next);
    setPersistenceAvailable(persisted);
    return { plan: next, persisted };
  }, [replaceState]);

  useEffect(() => {
    // Cross-tab updates replace local state; same-tab commits update both the ref
    // and React state because storage events are not fired in the originating tab.
    /** Reconciles plan changes written by another browser tab. */
    function handleStorage(event) {
      if (event.key !== PLANNER_STORAGE_KEY) return;
      replaceState(parseStoredPlan(event.newValue));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [replaceState]);

  const changeDuration = useCallback((durationDays) => commit(resizePlan(planRef.current, durationDays)), [commit]);
  const assignMeal = useCallback((address, configuration) => commit(setSlotMeal(planRef.current, address, { ...configuration, quantity: 1 })), [commit]);
  const removeMeal = useCallback((address) => commit(removeSlotMeal(planRef.current, address)), [commit]);
  const clearMeals = useCallback(() => commit(clearPlan(planRef.current)), [commit]);
  const moveMeal = useCallback((source, target) => commit(moveSlotMeal(planRef.current, source, target)), [commit]);
  const quickAdd = useCallback((configuration) => {
    const result = quickAddMeal(planRef.current, { ...configuration, quantity: 1 });
    if (!result.address) return { ...result, persisted: true };
    return { ...result, ...commit(result.plan) };
  }, [commit]);

  return { plan, persistenceAvailable, changeDuration, assignMeal, removeMeal, clearMeals, moveMeal, quickAdd };
}
