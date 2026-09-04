import { formatKobo } from "@nuede/domain/currency";
import { formatNutritionValue, NUTRITION_STATUS } from "@nuede/domain/nutrition";
import { CircleAlert, CircleCheck } from "lucide-react";

import { storefrontPaths } from "../../../app/routePaths.js";
import { Button } from "../../../components/ui/Button.jsx";
import { formatPlannerDate } from "../utils/plannerModel.js";

function NutritionMetric({ label, field, value }) {
  return <div><dt className="text-white/60">{label}</dt><dd className="mt-1 font-semibold">{value == null ? "—" : formatNutritionValue(field, value)}</dd></div>;
}

export function PlannerSummary({ plan, summary, onClear }) {
  const hasMeals = summary.selectedMealCount > 0;
  const nutrition = summary.nutrition.averageDaily;
  return (
    <section className="rounded-card bg-brand-950 p-5 text-white shadow-card" aria-labelledby="planner-summary-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="planner-summary-title" className="text-xs font-bold uppercase tracking-[0.18em] text-brand-pale-yellow">Plan summary</h2>
          <p className="mt-3 font-display text-3xl">{summary.selectedMealCount} / {summary.slotCapacity} slots filled</p>
        </div>
        <button type="button" disabled={!hasMeals} onClick={onClear} className="text-xs font-semibold text-brand-pale-yellow hover:text-white disabled:cursor-not-allowed disabled:text-white/35">Clear plan</button>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-white/15 py-4 text-sm">
        <div><dt className="text-white/60">Duration</dt><dd className="mt-1 font-semibold">{plan.durationDays} days</dd></div>
        <div><dt className="text-white/60">Dates</dt><dd className="mt-1 font-semibold">{formatPlannerDate(summary.startDate, { day: "numeric", month: "short" })} – {formatPlannerDate(summary.endDate, { day: "numeric", month: "short" })}</dd></div>
      </dl>
      {hasMeals ? (
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <NutritionMetric label="Calories/day" field="calories" value={nutrition.calories} />
          <NutritionMetric label="Protein/day" field="proteinG" value={nutrition.proteinG} />
          <NutritionMetric label="Carbs/day" field="carbohydratesG" value={nutrition.carbohydratesG} />
          <NutritionMetric label="Fat/day" field="fatG" value={nutrition.fatG} />
        </dl>
      ) : <p className="mt-5 text-sm leading-6 text-white/70">Choose at least one meal to see average daily nutrition.</p>}
      {hasMeals && summary.nutrition.status !== NUTRITION_STATUS.complete ? <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-amber-200"><CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Nutrition is incomplete for one or more selected meals; known values are estimates.</p> : null}
      {summary.invalidMealCount ? <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-red-200"><CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{summary.invalidMealCount} selected {summary.invalidMealCount === 1 ? "meal needs" : "meals need"} replacement or removal.</p> : null}
      <div className="mt-6 flex items-end justify-between gap-4">
        <p className="text-sm text-white/60">Estimated food total</p>
        <p className="font-display text-2xl">{!hasMeals ? "—" : summary.estimatedFoodTotalKobo === null ? "Incomplete" : formatKobo(summary.estimatedFoodTotalKobo)}</p>
      </div>
      {!summary.priceComplete && hasMeals ? <p className="mt-2 text-xs text-amber-200">The estimate excludes selections without a current valid price.</p> : null}
      {summary.checkoutReady ? (
        <Button to={`${storefrontPaths.checkout}?source=meal-plan`} className="mt-6 w-full bg-white text-brand-950 hover:bg-brand-100">
          <CircleCheck className="size-4" aria-hidden="true" />Continue to checkout
        </Button>
      ) : (
        <div className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-white/30 text-sm font-semibold text-white/75" role="status" aria-describedby="planner-checkout-note">
          <CircleCheck className="size-4" aria-hidden="true" />Plan not checkout-ready
        </div>
      )}
      <p id="planner-checkout-note" className="mt-3 text-xs leading-5 text-white/60">Checkout preserves this schedule and rechecks current availability. Displayed prices remain estimates.</p>
    </section>
  );
}
