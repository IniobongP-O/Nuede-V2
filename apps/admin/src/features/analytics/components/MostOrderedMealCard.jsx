import { Panel } from "../../../components/ui/AdminPrimitives.jsx";
import { getMostOrderedMeal } from "../utils/analyticsUtils.js";

export function MostOrderedMealCard({ productSales, loading = false }) {
  const meal = loading ? null : getMostOrderedMeal(productSales);

  return <Panel className="min-w-0 p-5 sm:p-6">
    <h2 className="text-lg font-semibold text-brand-950">Most ordered meal</h2>
    {loading ? <div className="mt-3" aria-label="Loading most ordered meal" aria-busy="true">
      <div className="h-8 w-64 max-w-full animate-pulse rounded bg-line" />
      <div className="mt-3 h-4 w-28 max-w-full animate-pulse rounded bg-line" />
    </div> : meal ? <>
      <p className="mt-3 wrap-anywhere text-2xl font-semibold tracking-tight text-brand-950">{meal.product_name}</p>
      <p className="mt-2 wrap-anywhere text-sm text-muted">{Number(meal.quantity_sold).toLocaleString("en-NG")} {Number(meal.quantity_sold) === 1 ? "unit" : "units"} sold</p>
    </> : <p className="mt-3 text-sm text-muted">No meal sales in this period</p>}
  </Panel>;
}
