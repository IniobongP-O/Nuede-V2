import { formatKobo } from "@nuede/domain/currency";
import { ImageOff, Pencil } from "lucide-react";
import { memo, useState } from "react";

import { Button } from "../../../components/ui/Button.jsx";
import { DataTable } from "../../../components/ui/DataTable.jsx";
import { ProductActions } from "./ProductActions.jsx";
import { ProductStatusBadge } from "./ProductStatusBadge.jsx";
import { catalogImageUrl } from "../api/imageApi.js";

/** Renders the current product image or a consistent catalog placeholder. */
function ProductImage({ product }) {
  const [failed, setFailed] = useState(false);
  return <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-control border border-line bg-canvas">{product.image_path && !failed ? <img src={catalogImageUrl(product.image_path)} alt="" className="size-full object-cover" onError={() => setFailed(true)} /> : <ImageOff className="size-4 text-muted" aria-hidden="true" />}</div>;
}

/** Renders compact calories and macro values for a product row. */
function NutritionSummary({ product }) {
  if (product.product_type === "grouped") return <span className="grid gap-1 text-xs text-muted"><span>Variant-specific</span><span className="max-w-40 truncate font-mono" title={`/menu/${product.slug}`}>/menu/{product.slug}</span></span>;
  const values = [product.calories, product.protein_g, product.carbohydrates_g, product.fat_g];
  const populated = values.filter((value) => value !== null && value !== undefined).length;
  const label = populated === 4 ? "Complete" : populated === 0 ? "Unavailable" : `${populated}/4 fields`;
  return <span className="grid gap-1 text-xs text-muted"><span>{label}</span><span className="max-w-40 truncate font-mono" title={`/menu/${product.slug}`}>/menu/{product.slug}</span></span>;
}

/** Renders memoized desktop and mobile catalog lists with row-level actions. */
export const ProductList = memo(function ProductList({ products, statusPendingId, onEdit, onStatusAction, onArchive }) {
  const renderActions = (product) => <div className="flex flex-wrap items-center justify-end gap-2"><Button size="small" variant="ghost" onClick={() => onEdit(product)}><Pencil className="size-3.5" aria-hidden="true" />{product.product_type === "grouped" ? "Manage" : "Edit"}</Button><ProductActions product={product} pending={statusPendingId === product.id} onAction={onStatusAction} onArchive={onArchive} /></div>;
  const price = (product) => product.product_type === "grouped"
    ? `${product.product_variants?.length || 0} variant${product.product_variants?.length === 1 ? "" : "s"}`
    : formatKobo(product.price_kobo);

  return <><div className="hidden md:block"><DataTable caption="Complete product catalog" columns={["Meal", "Type", "Category", "Price / variants", "Nutrition", "Status", "Actions"]} rows={products} renderRow={(product) => <tr key={product.id}><td className="px-4 py-4"><div className="flex items-center gap-3"><ProductImage product={product} /><div><p className="text-sm font-semibold text-brand-950">{product.name}</p><p className="mt-1 max-w-xs truncate text-xs text-muted">{product.description || "No description"}</p></div></div></td><td className="px-4 py-4 text-sm capitalize text-muted">{product.product_type}</td><td className="px-4 py-4 text-sm text-muted">{product.category?.name || "Uncategorized"}</td><td className="px-4 py-4 text-sm font-semibold text-brand-950">{price(product)}</td><td className="px-4 py-4"><NutritionSummary product={product} /></td><td className="px-4 py-4"><ProductStatusBadge status={product.status} /></td><td className="px-4 py-4">{renderActions(product)}</td></tr>} /></div><div className="grid gap-4 md:hidden">{products.map((product) => <article key={product.id} className="rounded-card border border-line bg-surface p-4"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><ProductImage product={product} /><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{product.product_type} · {product.category?.name || "Uncategorized"}</p><h2 className="mt-1 text-lg font-semibold text-brand-950">{product.name}</h2></div></div><ProductStatusBadge status={product.status} /></div><p className="mt-3 text-sm leading-6 text-muted">{product.description || "No description"}</p><div className="mt-4 flex items-center justify-between border-y border-line py-3"><span className="font-semibold text-brand-950">{price(product)}</span><NutritionSummary product={product} /></div><div className="mt-4">{renderActions(product)}</div></article>)}</div></>;
});
