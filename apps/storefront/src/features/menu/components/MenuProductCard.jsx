import { formatKobo } from "@nuede/domain/currency";
import { formatNutritionValue } from "@nuede/domain/nutrition";
import { Layers3 } from "lucide-react";
import { memo } from "react";

import { Button } from "../../../components/ui/Button.jsx";
import { Badge, Card } from "../../../components/ui/Surface.jsx";
import { FavoriteButton } from "../../saved-meals/components/FavoriteButton.jsx";
import { ProductImage } from "./ProductImage.jsx";

const statusPresentation = {
  available: { label: "Available", tone: "success", message: "Ready to order" },
  sold_out: { label: "Sold out", tone: "warning", message: "Currently sold out" },
  price_pending: { label: "Price pending", tone: "warning", message: "Ordering opens when pricing is confirmed" },
  unavailable: { label: "Unavailable", tone: "neutral", message: "Not available to order" },
};

/** Renders the card's compact calorie/protein preview and completeness state. */
/** Renders the compact nutrition preview shown on a menu card. */
function NutritionPreview({ nutrition, complete }) {
  const values = [
    nutrition.calories === null ? null : formatNutritionValue("calories", nutrition.calories, { includeLabel: true }),
    nutrition.proteinG === null ? null : formatNutritionValue("proteinG", nutrition.proteinG, { includeLabel: true }),
    nutrition.carbohydratesG === null ? null : formatNutritionValue("carbohydratesG", nutrition.carbohydratesG, { includeLabel: true }),
    nutrition.fatG === null ? null : formatNutritionValue("fatG", nutrition.fatG, { includeLabel: true }),
  ].filter(Boolean);

  if (!values.length) return <p className="text-xs text-muted">Nutrition details unavailable</p>;
  return (
    <div>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">{values.map((value) => <span key={value}>{value}</span>)}</p>
      {!complete ? <p className="mt-1 text-[0.7rem] font-medium text-warning">Partial nutrition information</p> : null}
    </div>
  );
}

// Catalog objects and the menu's state setter are stable across dialog updates.
// Keep unchanged card work out of opening, closing and basket context commits.
/** Renders one memoized catalog product card and its save/customize actions. */
export const MenuProductCard = memo(function MenuProductCard({ product, onOpenDetails }) {
  const status = statusPresentation[product.menuStatus] || statusPresentation.unavailable;
  const price = product.priceKobo === null
    ? product.menuStatus === "price_pending" ? "Price pending" : "Price unavailable"
    : `${product.pricePrefix}${formatKobo(product.priceKobo)}`;

  return (
    <Card className={`flex min-w-0 overflow-hidden flex-col ${product.isOrderable ? "" : "bg-surface/75"}`} aria-labelledby={`menu-product-${product.id}`}>
      <ProductImage key={product.imageUrl || "missing"} src={product.imageUrl} alt={product.name} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">{product.categoryName}</p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            <FavoriteButton productId={product.id} productName={product.name} />
          </div>
        </div>
        <h2 id={`menu-product-${product.id}`} className="mt-3 font-display text-2xl leading-tight text-brand-950">{product.name}</h2>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted">{product.description || "Description coming soon."}</p>
        {product.isGrouped ? (
          <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-700"><Layers3 className="size-4" aria-hidden="true" />Choose from {product.variantCount} {product.variantCount === 1 ? "option" : "options"}</p>
        ) : null}
        <div className="mt-4 border-y border-line py-3"><NutritionPreview nutrition={product.nutrition} complete={product.hasCompleteNutrition} /></div>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div><p className="font-semibold text-brand-950">{price}</p><p className="mt-1 text-xs text-muted">{product.isGrouped ? "Varies by meal option" : status.message}</p></div>
          <Button size="small" variant={product.isOrderable ? "primary" : "secondary"} onClick={() => onOpenDetails(product)} aria-label={`${product.isOrderable ? product.isGrouped ? "Choose" : "Customize" : "View details for"} ${product.name}`}>
            {product.isOrderable ? product.isGrouped ? "Choose meal" : "Customize" : "View details"}
          </Button>
        </div>
        {!product.isOrderable ? <span className="sr-only">This meal cannot currently be ordered.</span> : null}
      </div>
    </Card>
  );
});
