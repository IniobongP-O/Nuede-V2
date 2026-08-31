import { Plus } from "lucide-react";

import { Container } from "../components/layout/Container.jsx";
import { Badge, Card, PageHeader } from "../components/ui/Surface.jsx";
import { demoMeals, demoPlanDays } from "../fixtures/storefrontFixtures.js";

export function PlannerPage() {
  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <PageHeader eyebrow="Meal planner" title="Build your week without overthinking it." description="A responsive calendar, mobile day-card, meal-library, and summary composition using static fixtures only." />
      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="plan-title"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Your demo plan</p><h2 id="plan-title" className="mt-2 font-display text-3xl text-brand-950">Three-day layout foundation</h2></div><button type="button" className="text-sm font-semibold text-brand-700" aria-disabled="true">Clear plan · demo only</button></div>
          <div className="mt-6 grid gap-4">
            {demoPlanDays.map((day) => <Card key={day.day} className="p-4 sm:p-5"><div className="mb-4 flex items-baseline justify-between"><h3 className="font-semibold text-brand-950">{day.day}</h3><span className="text-xs text-muted">{day.date}</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{day.meals.map((meal, index) => <div key={`${day.day}-${meal}`} className="min-h-28 rounded-control border border-line bg-canvas p-3"><p className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-muted">{["Breakfast", "Lunch", "Dinner", "Snack"][index]}</p><p className="mt-3 text-sm font-semibold text-brand-950">{meal}</p>{meal.includes("slot") ? <span className="mt-3 inline-flex items-center gap-1 text-xs text-brand-700"><Plus className="size-3" />Future action</span> : <p className="mt-2 text-xs text-muted">Static fixture</p>}</div>)}</div></Card>)}
          </div>
        </section>
        <aside className="grid content-start gap-5" aria-label="Planner secondary panels">
          <Card className="p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Plan length</p><div className="mt-4 flex flex-wrap gap-2">{[2,3,4,5,6,7].map((days) => <button type="button" key={days} aria-pressed={days === 3} className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${days === 3 ? "border-brand-950 bg-brand-950 text-white" : "border-line"}`}>{days} days</button>)}</div><p className="mt-3 text-xs text-muted">Selection is visual only.</p></Card>
          <Card className="p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Meal library</p><div className="mt-4 grid gap-4">{demoMeals.slice(0,3).map((meal) => <div key={meal.id} className="border-b border-line pb-4 last:border-0 last:pb-0"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-brand-950">{meal.name}</p><Badge tone={meal.available ? "success" : "warning"}>{meal.available ? "Demo" : "Unavailable"}</Badge></div><p className="mt-1 text-xs text-muted">{meal.nutrition}</p></div>)}</div></Card>
          <Card className="bg-brand-950 p-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-green-300">Plan summary</p><p className="mt-3 font-display text-3xl">4 / 12 slots shown</p><dl className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-white/60">Duration</dt><dd className="mt-1 font-semibold">3 demo days</dd></div><div><dt className="text-white/60">Nutrition</dt><dd className="mt-1 font-semibold">Not calculated</dd></div></dl></Card>
        </aside>
      </div>
    </Container>
  );
}
