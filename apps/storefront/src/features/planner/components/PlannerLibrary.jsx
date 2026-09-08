import { formatKobo } from "@nuede/domain/currency";
import { formatNutritionValue } from "@nuede/domain/nutrition";
import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Surface.jsx";
import { ProductImage } from "../../menu/components/ProductImage.jsx";
import { filterPlannerProducts, PLANNER_FILTERS } from "../utils/plannerFilters.js";
import { formatPlannerDate, PLANNER_SLOTS } from "../utils/plannerModel.js";

/** Formats the currently selected planner destination for customer guidance. */
function targetLabel(target) {
  if (!target) return "Choose a slot, or use Quick add.";
  const slot = PLANNER_SLOTS.find(({ key }) => key === target.slot)?.label || target.slot;
  return `${slot}, ${formatPlannerDate(target.date, { weekday: "short", day: "numeric", month: "short" })} selected`;
}

/** Produces concise calorie/protein copy for a planner library card. */
function nutritionPreview(product) {
  const values = [
    product.nutrition.calories == null ? null : formatNutritionValue("calories", product.nutrition.calories),
    product.nutrition.proteinG == null ? null : formatNutritionValue("proteinG", product.nutrition.proteinG, { includeLabel: true }),
  ].filter(Boolean);
  return values.length ? values.join(" · ") : "Nutrition unavailable";
}

/** Renders the searchable planner meal library with targeted and quick-add actions. */
export function PlannerLibrary({ products, categories, activeTarget, onChoose, onQuickAdd }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const visibleProducts = useMemo(
    () => filterPlannerProducts(products, categories, { search, filter }),
    [products, categories, search, filter],
  );

  return (
    <section className="rounded-card border border-line bg-surface p-5" aria-labelledby="planner-library-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="planner-library-title" className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Choose meals</h2>
          <p className="mt-2 text-xs font-medium text-muted" role="status">{targetLabel(activeTarget)}</p>
        </div>
        <Badge tone={activeTarget ? "success" : "neutral"}>{activeTarget ? "Slot selected" : "Quick add"}</Badge>
      </div>
      <label className="relative mt-4 block" htmlFor="planner-meal-search">
        <span className="sr-only">Search meals</span>
        <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted" aria-hidden="true" />
        <input id="planner-meal-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search meals..." className="min-h-11 w-full rounded-control border border-line bg-surface pl-10 pr-3 text-sm text-ink placeholder:text-muted/70 hover:border-muted focus:border-brand-700" />
      </label>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Filter meals">
        {PLANNER_FILTERS.map((item) => (
          <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`min-h-8 rounded-full border px-3 text-xs font-semibold ${filter === item.id ? "border-brand-950 bg-brand-950 text-white" : "border-line text-brand-950 hover:border-brand-700"}`}>{item.label}</button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted" aria-live="polite">{visibleProducts.length} {visibleProducts.length === 1 ? "meal" : "meals"}</p>
      <div className="mt-4 grid max-h-[38rem] gap-4 overflow-y-auto pr-1">
        {visibleProducts.map((product) => (
          <article
            key={product.id}
            data-planner-product={product.id}
            className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 border-b border-line pb-4 last:border-0 last:pb-0"
            draggable={product.isOrderable}
            onDragStart={(event) => { event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData("text/plain", product.id); }}
          >
            <ProductImage src={product.imageUrl} alt="" className="aspect-square size-[4.5rem] rounded-control" />
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-5 text-brand-950">{product.name}</h3>
                {!product.isOrderable ? <Badge tone="warning">{product.menuStatus === "sold_out" ? "Sold out" : "Unavailable"}</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-muted">{nutritionPreview(product)}</p>
              <p className="mt-1 text-xs font-semibold text-brand-950">{product.priceKobo === null ? "Price unavailable" : `${product.pricePrefix}${formatKobo(product.priceKobo)}`}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="small" className="min-h-9 px-3 text-xs" variant={product.isOrderable ? "primary" : "secondary"} onClick={() => onChoose(product)}>
                  {product.isOrderable ? activeTarget ? "Choose for slot" : "Review meal" : "View details"}
                </Button>
                <button type="button" disabled={!product.isOrderable} className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand-700 disabled:cursor-not-allowed disabled:text-muted" onClick={() => onQuickAdd(product)}>Quick add <ArrowRight className="size-3.5" aria-hidden="true" /></button>
              </div>
            </div>
          </article>
        ))}
        {!visibleProducts.length ? <p className="rounded-control bg-canvas p-4 text-sm text-muted">No meals match your search and filters.</p> : null}
      </div>
      <p className="mt-4 text-xs leading-5 text-muted">On desktop, you can also drag meals into a slot. Every action is available by click, tap, or keyboard.</p>
    </section>
  );
}
