import { formatKobo } from "@nuede/domain/currency";

export function AddonPicker({ addons, selectedIds, onChange, disabled = false }) {
  const selected = new Set(selectedIds || []);
  const toggle = (addonId, checked) => {
    const next = checked
      ? [...selected, addonId]
      : [...selected].filter((id) => id !== addonId);
    onChange(next);
  };

  return <fieldset className="grid gap-3" disabled={disabled}><legend className="text-sm font-semibold text-brand-950">Compatible add-ons</legend><p className="text-sm text-muted">Selected extras are available for this product or shared by every variant in this group.</p>{addons.length === 0 ? <p className="rounded-control border border-dashed border-line p-4 text-sm text-muted">No add-ons exist yet. Save this form and create add-ons from the Add-ons control.</p> : <div className="grid gap-2 sm:grid-cols-2">{addons.map((addon) => <label key={addon.id} className="flex cursor-pointer items-start gap-3 rounded-control border border-line p-3 hover:bg-brand-100/40"><input type="checkbox" className="mt-1 size-4 accent-brand-700" checked={selected.has(addon.id)} onChange={(event) => toggle(addon.id, event.target.checked)} /><span className="min-w-0"><span className="block text-sm font-semibold text-brand-950">{addon.name}</span><span className="block text-xs text-muted">{formatKobo(addon.price_kobo)} · {addon.is_available ? "Available" : "Unavailable"}</span></span></label>)}</div>}</fieldset>;
}
