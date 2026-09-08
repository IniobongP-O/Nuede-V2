import { GripVertical, Plus, TriangleAlert } from "lucide-react";

import { Badge } from "../../../components/ui/Surface.jsx";
import { ProductImage } from "../../menu/components/ProductImage.jsx";
import { formatPlannerDate, PLANNER_SLOTS } from "../utils/plannerModel.js";

const dragType = "application/x-nuede-planner-slot";

/** Compares two optional planner slot addresses. */
function sameAddress(left, right) {
  return left?.date === right?.date && left?.slot === right?.slot;
}

/** Renders one selectable, replaceable, removable, and drag/drop meal slot. */
function MealSlot({ date, definition, meal, activeTarget, onSelect, onReplace, onRemove, onDropProduct, onMoveMeal }) {
  const address = { date, slot: definition.key };
  const active = sameAddress(activeTarget, address);

  /** Publishes this occupied slot's address as the drag payload. */
  function handleDragStart(event) {
    if (!meal) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(dragType, JSON.stringify(address));
  }

  /** Routes a dropped catalog product or existing meal to the correct transition. */
  function handleDrop(event) {
    event.preventDefault();
    const source = event.dataTransfer.getData(dragType);
    if (source) {
      try { onMoveMeal(JSON.parse(source), address); } catch { /* Ignore foreign drag data. */ }
      return;
    }
    const productId = event.dataTransfer.getData("text/plain");
    if (productId) onDropProduct(productId, address);
  }

  return (
    <div
      className={`min-h-36 rounded-card border p-3 transition-colors ${active ? "border-brand-700 bg-brand-100 ring-2 ring-brand-700/15" : meal ? meal.orderable ? "border-line bg-surface" : "border-red-200 bg-red-50/50" : "border-dashed border-line bg-canvas/70"}`}
      data-planner-slot={`${date}:${definition.key}`}
      aria-label={`${definition.label} for ${formatPlannerDate(date, { weekday: "long", day: "numeric", month: "long" })}`}
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
      onDrop={handleDrop}
    >
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-muted">{definition.label}</p>
      {!meal ? (
        <button type="button" aria-pressed={active} className="mt-3 flex min-h-24 w-full items-center justify-center gap-2 rounded-control text-sm font-semibold text-brand-700 hover:bg-brand-100" onClick={() => onSelect(address)}>
          <Plus className="size-4" aria-hidden="true" />Add meal
        </button>
      ) : (
        <div className="mt-3" draggable onDragStart={handleDragStart}>
          <div className="flex items-start gap-3">
            <ProductImage src={meal.variant?.imageUrl || meal.product?.imageUrl || ""} alt="" className="size-14 shrink-0 rounded-control" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-1">
                <p className="min-w-0 flex-1 text-sm font-semibold leading-5 text-brand-950">{meal.product?.name || "Unavailable meal"}</p>
                <GripVertical className="size-4 shrink-0 text-muted" aria-hidden="true" />
              </div>
              {meal.variant ? <p className="mt-1 text-xs text-muted">{meal.variant.name}</p> : null}
              {meal.addons.length ? <p className="mt-1 line-clamp-2 text-xs text-muted">+ {meal.addons.map((addon) => addon.name).join(", ")}</p> : null}
            </div>
          </div>
          {!meal.orderable ? <div className="mt-3 flex items-start gap-2 text-xs text-danger"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /><span>{meal.message}</span></div> : null}
          {active ? <div className="mt-3"><Badge tone="success">Selected slot</Badge></div> : null}
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs font-semibold">
            <button type="button" className="text-brand-700 hover:text-brand-950" onClick={() => onReplace(address)}>Replace</button>
            <button type="button" className="text-danger hover:brightness-75" onClick={() => onRemove(address)}>Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Renders the dated planner grid and routes slot interactions to its owner. */
export function PlannerSchedule({ plan, activeTarget, onSelect, onReplace, onRemove, onDropProduct, onMoveMeal }) {
  return (
    <div className="grid gap-4" aria-label="Meal plan schedule">
      {plan.days.map((day) => (
        <article key={day.date} className="rounded-card border border-line bg-surface p-4 sm:p-5 lg:grid lg:grid-cols-[6.5rem_minmax(0,1fr)] lg:gap-4" aria-labelledby={`planner-day-${day.date}`}>
          <header className="mb-4 border-b border-line pb-3 lg:mb-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-700">{formatPlannerDate(day.date, { weekday: "short" })}</p>
            <h3 id={`planner-day-${day.date}`} className="mt-1 font-display text-xl text-brand-950">{formatPlannerDate(day.date, { day: "numeric", month: "short" })}</h3>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PLANNER_SLOTS.map((definition) => (
              <MealSlot
                key={definition.key}
                date={day.date}
                definition={definition}
                meal={day.slots[definition.key]}
                activeTarget={activeTarget}
                onSelect={onSelect}
                onReplace={onReplace}
                onRemove={onRemove}
                onDropProduct={onDropProduct}
                onMoveMeal={onMoveMeal}
              />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
