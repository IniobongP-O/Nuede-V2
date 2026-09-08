import { useState } from "react";

import { businessDate, rangeForPreset, validateCustomRange } from "../utils/analyticsUtils.js";

/** Owns preset/custom analytics dates and exposes only validated active ranges. */
export function useAnalyticsRange(defaultPreset = "30d") {
  const today = businessDate();
  const initial = rangeForPreset(defaultPreset, today);
  const [preset, setPreset] = useState(defaultPreset);
  const [range, setRange] = useState(initial);
  const [draft, setDraft] = useState({ from: initial.from, to: initial.to });
  const [validationError, setValidationError] = useState("");

  const selectPreset = (nextPreset) => {
    setPreset(nextPreset);
    setValidationError("");
    if (nextPreset !== "custom") {
      const nextRange = rangeForPreset(nextPreset, businessDate());
      setRange(nextRange);
      setDraft({ from: nextRange.from, to: nextRange.to });
    }
  };

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setValidationError("");
  };

  const applyCustomRange = () => {
    const error = validateCustomRange(draft.from, draft.to);
    setValidationError(error);
    if (error) return false;
    setRange({ ...draft, preset: "custom" });
    return true;
  };

  return { preset, range, draft, validationError, selectPreset, updateDraft, applyCustomRange };
}
