import { formatKobo } from "@nuede/domain/currency";
import { formatNutritionValue, NUTRITION_FIELDS } from "@nuede/domain/nutrition";
import { AlertTriangle } from "lucide-react";

import { Card } from "../../../components/ui/Surface.jsx";
import { formatPlannerDate, PLANNER_SLOTS } from "../../planner/utils/plannerModel.js";
import { CHECKOUT_SOURCE } from "../utils/checkoutModel.js";

function NutritionReview({ nutrition }) {
  if (!nutrition?.hasAny) return <p className="mt-3 text-sm text-muted">Nutrition information is unavailable for this order.</p>;
  return (
    <div className="mt-4 rounded-control bg-canvas p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Order nutrition</p>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        {NUTRITION_FIELDS.map(({ key, label }) => (
          <div key={key}><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 text-sm font-semibold text-brand-950">{formatNutritionValue(key, nutrition[key])}{nutrition[`${key}Complete`] ? "" : "*"}</dd></div>
        ))}
      </dl>
      {!nutrition.isComplete ? <p className="mt-3 text-xs leading-5 text-warning">*Known values only. At least one selection has incomplete nutrition.</p> : null}
    </div>
  );
}

function CartReview({ items }) {
  return (
    <ul className="mt-5 divide-y divide-line">
      {items.map((item, index) => (
        <li key={item.key || index} className="grid gap-2 py-4 first:pt-0">
          <div className="flex items-start justify-between gap-4">
            <div><p className="font-semibold text-brand-950">{item.product?.name || "Unavailable meal"} × {item.configuration.quantity}</p>{item.variant ? <p className="mt-1 text-xs text-brand-700">{item.variant.name}</p> : null}</div>
            <p className="text-sm font-semibold text-brand-950">{item.price.complete ? formatKobo(item.price.linePriceKobo) : "Unavailable"}</p>
          </div>
          {item.addons.length ? <p className="text-xs leading-5 text-muted">Add-ons: {item.addons.map((addon) => addon.name).join(", ")}</p> : null}
          {!item.orderable ? <p className="flex gap-2 text-xs leading-5 text-danger"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{item.message}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function MealPlanReview({ summary }) {
  return (
    <div className="mt-5 grid gap-4">
      <p className="text-sm text-muted">{summary.selectedMealCount} / {summary.slotCapacity} slots · {summary.hydratedPlan.durationDays} days · {formatPlannerDate(summary.startDate, { day: "numeric", month: "short" })}–{formatPlannerDate(summary.endDate, { day: "numeric", month: "short" })}</p>
      {summary.hydratedPlan.days.map((day) => {
        const meals = PLANNER_SLOTS.flatMap(({ key, label }) => day.slots[key] ? [{ key, label, meal: day.slots[key] }] : []);
        if (!meals.length) return null;
        return (
          <section key={day.date} className="rounded-control border border-line p-4" aria-labelledby={`checkout-day-${day.date}`}>
            <h3 id={`checkout-day-${day.date}`} className="font-semibold text-brand-950">{formatPlannerDate(day.date, { weekday: "long", day: "numeric", month: "short" })}</h3>
            <ul className="mt-3 grid gap-3">
              {meals.map(({ key, label, meal }) => (
                <li key={key} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3 text-sm">
                  <span className="font-semibold text-brand-700">{label}</span>
                  <span><span className="font-semibold text-brand-950">{meal.product?.name || "Unavailable meal"}</span>{meal.variant ? <span className="block text-xs text-muted">{meal.variant.name}</span> : null}{meal.addons.length ? <span className="block text-xs text-muted">Add-ons: {meal.addons.map((addon) => addon.name).join(", ")}</span> : null}{!meal.orderable ? <span className="mt-1 block text-xs text-danger">{meal.message}</span> : null}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function CheckoutReview({ source, cartItems, plannerSummary, nutrition, subtotalKobo, selectedZone, totalKobo }) {
  return (
    <Card as="section" className="p-5 sm:p-6" aria-labelledby="checkout-review-title">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Order review</p>
      <h2 id="checkout-review-title" className="mt-2 font-display text-2xl text-brand-950">{source === CHECKOUT_SOURCE.cart ? "Your basket" : "Your meal plan"}</h2>
      {source === CHECKOUT_SOURCE.cart ? <CartReview items={cartItems} /> : <MealPlanReview summary={plannerSummary} />}
      <NutritionReview nutrition={nutrition} />
      <dl className="mt-5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-muted">Estimated food subtotal</dt><dd className="font-semibold text-brand-950">{subtotalKobo === null ? "Unavailable" : formatKobo(subtotalKobo)}</dd></div>
        <div className="mt-3 flex justify-between gap-4"><dt className="text-muted">Delivery{selectedZone ? ` · ${selectedZone.name}` : ""}</dt><dd className="font-semibold text-brand-950">{selectedZone ? formatKobo(selectedZone.feeKobo) : "Choose an area"}</dd></div>
        <div className="mt-4 flex justify-between gap-4 border-t border-line pt-4 text-base"><dt className="font-semibold text-brand-950">Estimated total</dt><dd className="font-display text-2xl text-brand-950">{totalKobo === null ? "—" : formatKobo(totalKobo)}</dd></div>
      </dl>
      <p className="mt-4 text-xs leading-5 text-muted">These are display estimates. The server will re-read current products, options, delivery fee, and settings before any future order or payment.</p>
    </Card>
  );
}
