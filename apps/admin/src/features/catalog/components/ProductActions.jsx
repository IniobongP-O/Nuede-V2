import { useState } from "react";

import { Button } from "../../../components/ui/Button.jsx";

function actionsFor(product) {
  if (product.status === "archived") return [{ value: "restore", label: "Restore as hidden" }];
  const actions = [];
  if (product.status !== "available") actions.push({ value: "mark_available", label: "Mark available" });
  if (product.status !== "sold_out") actions.push({ value: "mark_sold_out", label: "Mark sold out" });
  if (product.status === "hidden") actions.push({ value: "show", label: "Show" });
  if (product.status !== "hidden") actions.push({ value: "hide", label: "Hide" });
  actions.push({ value: "archive", label: "Archive" });
  return actions;
}

export function ProductActions({ product, pending, onAction, onArchive }) {
  const actions = actionsFor(product);
  const [action, setAction] = useState(actions[0]?.value || "");
  const selectedAction = actions.some((item) => item.value === action) ? action : actions[0]?.value || "";

  const apply = () => {
    if (selectedAction === "archive") onArchive(product);
    else onAction(product, selectedAction);
  };

  return <div className="flex min-w-56 items-end gap-2"><label className="sr-only" htmlFor={`product-action-${product.id}`}>Status action for {product.name}</label><select id={`product-action-${product.id}`} className="min-h-9 min-w-0 flex-1 rounded-control border border-line bg-surface px-2 text-xs text-brand-950" value={selectedAction} onChange={(event) => setAction(event.target.value)} disabled={pending}>{actions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><Button size="small" variant="secondary" disabled={!selectedAction} busy={pending} onClick={apply}>Apply</Button></div>;
}
