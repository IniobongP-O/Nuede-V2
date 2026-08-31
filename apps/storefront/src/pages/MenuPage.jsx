import { Search } from "lucide-react";
import { useState } from "react";

import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Dialog } from "../components/ui/Dialog.jsx";
import { TextInput } from "../components/ui/FormControls.jsx";
import { Badge, Card, PageHeader } from "../components/ui/Surface.jsx";
import { useToast } from "../components/ui/toastContext.js";
import { demoMeals } from "../fixtures/storefrontFixtures.js";

const filters = ["All meals", "Main meals", "Sides", "High protein", "Complete macros", "Available now"];

export function MenuPage() {
  const [selectedMeal, setSelectedMeal] = useState(null);
  const { notify } = useToast();

  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <PageHeader eyebrow="Our menu" title="Prepared meals, not endless choices." description="This static shell establishes the future search, filter, product-card, availability, modal, and notification patterns." />
      <div className="mt-8 max-w-3xl"><TextInput label="Search the menu" type="search" placeholder="Search meals, ingredients, or tags" help="Demo input only—results do not change in Cycle 1." /></div>
      <div className="mt-5 flex flex-wrap gap-2" aria-label="Demonstration filter states">{filters.map((filter, index) => <button key={filter} type="button" aria-pressed={index === 0} className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${index === 0 ? "border-brand-950 bg-brand-950 text-white" : "border-line bg-surface text-brand-950 hover:border-muted"}`}>{filter}</button>)}</div>
      <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted"><Search className="size-4" />Static controls preview layout only; no filtering is performed.</p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {demoMeals.map((meal) => (
          <Card key={meal.id} className="flex overflow-hidden flex-col">
            <div className={`aspect-[4/3] bg-gradient-to-br ${meal.tone}`} role="img" aria-label={`Decorative demo image placeholder for ${meal.name}`} />
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">{meal.category}</p>{meal.available ? <Badge tone="success">Available</Badge> : <Badge tone="warning">Sold out demo</Badge>}</div>
              <h2 className="mt-3 font-display text-2xl text-brand-950">{meal.name}</h2><p className="mt-2 flex-1 text-sm leading-6 text-muted">{meal.description}</p><p className="mt-4 border-y border-line py-3 text-xs text-muted">{meal.nutrition}</p>
              <div className="mt-4 flex items-center justify-between gap-4"><span className="font-semibold text-brand-950">{meal.price}</span><Button variant="ghost" size="small" onClick={() => setSelectedMeal(meal)}>Preview details</Button></div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(selectedMeal)} onClose={() => setSelectedMeal(null)} title={selectedMeal?.name || "Demo meal"} description="Accessible modal foundation—no customization or cart behavior is implemented." footer={<><Button variant="ghost" onClick={() => setSelectedMeal(null)}>Close</Button><Button onClick={() => notify("Demo notification only — no meal was added or saved.")}>Preview notification</Button></>}>
        <div className={`aspect-[2/1] rounded-card bg-gradient-to-br ${selectedMeal?.tone || "from-brand-100 to-white"}`} aria-hidden="true" />
        <div className="mt-5 grid gap-4 sm:grid-cols-3"><div><p className="text-xs text-muted">Price fixture</p><p className="mt-1 font-semibold text-brand-950">{selectedMeal?.price}</p></div><div><p className="text-xs text-muted">Nutrition fixture</p><p className="mt-1 font-semibold text-brand-950">{selectedMeal?.nutrition}</p></div><div><p className="text-xs text-muted">Availability</p><p className="mt-1 font-semibold text-brand-950">Demo only</p></div></div>
      </Dialog>
    </Container>
  );
}
