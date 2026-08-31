import { formatKobo } from "@nuede/domain/currency";
import { Pencil } from "lucide-react";

import { Button } from "../../../components/ui/Button.jsx";
import { DataTable } from "../../../components/ui/DataTable.jsx";
import { ProductActions } from "./ProductActions.jsx";
import { ProductStatusBadge } from "./ProductStatusBadge.jsx";

function NutritionSummary({ product }) {
  const values = [product.calories, product.protein_g, product.carbohydrates_g, product.fat_g];
  const populated = values.filter((value) => value !== null && value !== undefined).length;
  const label = populated === 4 ? "Complete" : populated === 0 ? "Unavailable" : `${populated}/4 fields`;
  return <span className="text-xs text-muted">{label}</span>;
}

export function ProductList({ products, statusPendingId, onEdit, onStatusAction, onArchive }) {
  const renderActions = (product) => <div className="flex flex-wrap items-center justify-end gap-2"><Button size="small" variant="ghost" onClick={() => onEdit(product)}><Pencil className="size-3.5" aria-hidden="true" />Edit</Button><ProductActions product={product} pending={statusPendingId === product.id} onAction={onStatusAction} onArchive={onArchive} /></div>;

  return <><div className="hidden md:block"><DataTable caption="Standard product catalog" columns={["Meal", "Category", "Price", "Nutrition", "Status", "Actions"]} rows={products} renderRow={(product) => <tr key={product.id}><td className="px-4 py-4"><p className="text-sm font-semibold text-brand-950">{product.name}</p><p className="mt-1 max-w-xs truncate text-xs text-muted">{product.description || "No description"}</p></td><td className="px-4 py-4 text-sm text-muted">{product.category?.name || "Uncategorized"}</td><td className="px-4 py-4 text-sm font-semibold text-brand-950">{formatKobo(product.price_kobo)}</td><td className="px-4 py-4"><NutritionSummary product={product} /></td><td className="px-4 py-4"><ProductStatusBadge status={product.status} /></td><td className="px-4 py-4">{renderActions(product)}</td></tr>} /></div><div className="grid gap-4 md:hidden">{products.map((product) => <article key={product.id} className="rounded-card border border-line bg-surface p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{product.category?.name || "Uncategorized"}</p><h2 className="mt-1 text-lg font-semibold text-brand-950">{product.name}</h2></div><ProductStatusBadge status={product.status} /></div><p className="mt-3 text-sm leading-6 text-muted">{product.description || "No description"}</p><div className="mt-4 flex items-center justify-between border-y border-line py-3"><span className="font-semibold text-brand-950">{formatKobo(product.price_kobo)}</span><NutritionSummary product={product} /></div><div className="mt-4">{renderActions(product)}</div></article>)}</div></>;
}
