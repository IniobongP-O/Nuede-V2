import { Heart } from "lucide-react";

import { useToast } from "../../../components/ui/toastContext.js";
import { useSavedMeals } from "../context/savedMealsContext.js";

export function FavoriteButton({ productId, productName, className = "" }) {
  const { isSaved, saveMeal, removeMeal } = useSavedMeals();
  const { notify } = useToast();
  const saved = isSaved(productId);

  function toggleSaved(event) {
    event.stopPropagation();
    const result = saved ? removeMeal(productId) : saveMeal(productId);
    if (!result.changed) return;
    if (!result.persisted) {
      notify("Your browser blocked Saved Meals persistence.", "error");
      return;
    }
    notify(saved ? "Removed from saved meals" : "Meal saved");
  }

  return (
    <button
      type="button"
      className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-control border px-3 text-xs font-semibold transition-colors ${saved ? "border-brand-700 bg-brand-100 text-brand-950" : "border-line bg-surface text-muted hover:border-brand-700 hover:text-brand-950"} ${className}`}
      aria-label={saved ? `Remove ${productName} from saved meals` : `Save ${productName}`}
      aria-pressed={saved}
      onClick={toggleSaved}
    >
      <Heart className="size-4" fill={saved ? "currentColor" : "none"} aria-hidden="true" />
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
