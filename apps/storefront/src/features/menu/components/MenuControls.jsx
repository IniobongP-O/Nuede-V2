import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "../../../components/ui/Button.jsx";
import { TextInput } from "../../../components/ui/FormControls.jsx";

const quickFilters = Object.freeze([
  { id: "grouped", label: "Grouped meals" },
  { id: "available", label: "Available only" },
  { id: "high-protein", label: "High protein" },
  { id: "complete-nutrition", label: "Complete nutrition" },
]);

function ToggleChip({ pressed, children, ...props }) {
  return <button type="button" aria-pressed={pressed} className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${pressed ? "border-brand-950 bg-brand-950 text-white" : "border-line bg-surface text-brand-950 hover:border-muted"}`} {...props}>{children}</button>;
}

export function MenuControls({ categories, search, onSearchChange, categoryId, onCategoryChange, filters, onFilterToggle, resultCount, onReset }) {
  const hasRefinements = search.trim() || categoryId !== "all" || filters.length;

  return (
    <section className="mt-8 rounded-card border border-line bg-surface p-4 sm:p-6" aria-label="Menu search and filters">
      <div className="relative max-w-3xl">
        <Search className="pointer-events-none absolute bottom-3.5 left-3.5 z-10 size-4 text-muted" aria-hidden="true" />
        <TextInput id="menu-search" label="Search the menu" type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search by meal, description, or category" className="pl-10" />
      </div>
      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Categories</p>
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-2" aria-label="Menu categories">
          <ToggleChip pressed={categoryId === "all"} onClick={() => onCategoryChange("all")}>All meals</ToggleChip>
          {categories.map((category) => <ToggleChip key={category.id} pressed={categoryId === category.id} onClick={() => onCategoryChange(category.id)}>{category.name}</ToggleChip>)}
        </div>
      </div>
      <div className="mt-4 border-t border-line pt-4 sm:flex sm:items-end sm:justify-between sm:gap-5">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-700"><SlidersHorizontal className="size-4" aria-hidden="true" />Refine</p>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Menu filters">
            {quickFilters.map((filter) => <ToggleChip key={filter.id} pressed={filters.includes(filter.id)} onClick={() => onFilterToggle(filter.id)}>{filter.label}</ToggleChip>)}
          </div>
        </div>
        <div className="mt-4 flex shrink-0 items-center justify-between gap-3 sm:mt-0 sm:flex-col sm:items-end">
          <p className="text-sm text-muted" aria-live="polite">{resultCount} {resultCount === 1 ? "meal" : "meals"}</p>
          {hasRefinements ? <Button variant="ghost" size="small" onClick={onReset}><X className="size-4" aria-hidden="true" />Reset</Button> : null}
        </div>
      </div>
    </section>
  );
}
