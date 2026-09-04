import { useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { EmptyState, ErrorState } from "../../../components/ui/FeedbackStates.jsx";
import { useToast } from "../../../components/ui/toastContext.js";
import { useCart } from "../../cart/context/cartContext.js";
import { MenuProductCard } from "../../menu/components/MenuProductCard.jsx";
import { MenuSkeleton } from "../../menu/components/MenuSkeleton.jsx";
import { ProductDetailDialog } from "../../product-detail/components/ProductDetailDialog.jsx";
import { buildProductConfiguration } from "../../product-detail/utils/customizationModel.js";
import { ScrollCarousel } from "./ScrollCarousel.jsx";

export function FeaturedMeals({ query }) {
  const [selection, setSelection] = useState(null);
  const { addItem } = useCart();
  const { notify } = useToast();
  const products = query.data || [];
  const selected = selection ? products.find((product) => product.id === selection.id) || { ...selection, status: "hidden", menuStatus: "unavailable", isOrderable: false } : null;
  const configured = (configuration) => {
    const result = addItem(configuration);
    if (!result.changed) { notify("This quantity could not be added. Please review your basket.", "error"); return; }
    notify(result.persisted ? "Meal added to your basket." : "Meal added for this visit. Browser storage is unavailable.", result.persisted ? "success" : "error");
  };
  const quickAdd = (product) => {
    if (product.isGrouped || product.addons.length) { setSelection(product); return; }
    const result = buildProductConfiguration({ product, quantity: 1 });
    if (!result.valid) { notify(result.issues[0].message, "error"); return; }
    configured(result.configuration);
  };
  if (query.isPending) return <MenuSkeleton />;
  if (query.isError) return <ErrorState title="Featured meals are unavailable" message="Please check your connection and try again." action={<Button onClick={() => query.refetch()}>Try again</Button>} />;
  if (!products.length) return <EmptyState title="The menu is being prepared" message="There are no featured meals to show right now. Please check back soon." />;
  return <><ScrollCarousel label="featured meals">{products.slice(0, 8).map((product) => <div key={product.id} className="w-[88%] shrink-0 snap-start sm:w-[47%] lg:w-[32%]"><MenuProductCard product={product} onOpenDetails={setSelection} /><Button className="mt-3 w-full" variant="secondary" disabled={!product.isOrderable} onClick={() => quickAdd(product)} aria-label={`${product.isGrouped || product.addons.length ? "Choose options for" : "Quick add"} ${product.name}`}>{product.isGrouped || product.addons.length ? "Choose options" : "Quick add to basket"}</Button></div>)}</ScrollCarousel>
    {selected ? <ProductDetailDialog key={selected.id} product={selected} open onClose={() => setSelection(null)} onConfigured={configured} /> : null}
  </>;
}
