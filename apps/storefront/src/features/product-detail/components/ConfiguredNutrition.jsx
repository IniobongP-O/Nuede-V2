import { formatNutritionValue, NUTRITION_FIELDS } from "@nuede/domain/nutrition";

export function ConfiguredNutrition({ nutrition, quantity }) {
  if (!nutrition.hasAny) {
    return <p className="rounded-control bg-canvas p-4 text-sm text-muted">Nutrition details are not available for this selection.</p>;
  }

  return (
    <div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {NUTRITION_FIELDS.map(({ key, label }) => {
          const value = nutrition[key];
          const complete = nutrition[`${key}Complete`];
          return (
            <div key={key} className="rounded-control bg-canvas p-3">
              <dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted">{label}</dt>
              <dd className="mt-1 font-semibold text-brand-950">
                {formatNutritionValue(key, value)}{value !== null && !complete ? "*" : ""}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-2 text-xs leading-5 text-muted">
        Values shown are for {quantity} {quantity === 1 ? "meal" : "meals"}.
        {!nutrition.isComplete ? " *Known values only; at least one selected component has incomplete nutrition." : ""}
      </p>
    </div>
  );
}
