import { PLANNER_DURATIONS } from "../utils/plannerModel.js";

export function PlannerDuration({ durationDays, onChange }) {
  return (
    <section className="rounded-card border border-line bg-surface p-5" aria-labelledby="planner-duration-title">
      <h2 id="planner-duration-title" className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Plan length</h2>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choose plan duration">
        {PLANNER_DURATIONS.map((days) => (
          <button
            type="button"
            key={days}
            aria-pressed={durationDays === days}
            className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${durationDays === days ? "border-brand-950 bg-brand-950 text-white" : "border-line bg-surface text-brand-950 hover:border-brand-700 hover:bg-brand-100"}`}
            onClick={() => onChange(days)}
          >
            {days} days
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">Dates begin tomorrow and stay fixed when this plan is restored.</p>
    </section>
  );
}
