import { formatKobo } from "@nuede/domain/currency";
import { formatNutritionValue } from "@nuede/domain/nutrition";
import { Check, Minus, Plus } from "lucide-react";

import { Button, IconButton } from "../../../components/ui/Button.jsx";
import { Dialog } from "../../../components/ui/Dialog.jsx";
import { Badge } from "../../../components/ui/Surface.jsx";
import { ProductImage } from "../../menu/components/ProductImage.jsx";
import { FavoriteButton } from "../../saved-meals/components/FavoriteButton.jsx";
import { useProductCustomization } from "../hooks/useProductCustomization.js";
import {
  calculateConfiguredDisplayPrice,
  calculateConfiguredItemNutrition,
  isVariantOrderableForProduct,
} from "../utils/customizationModel.js";
import { ConfiguredNutrition } from "./ConfiguredNutrition.jsx";

const statusPresentation = {
  available: { label: "Available", tone: "success" },
  sold_out: { label: "Sold out", tone: "warning" },
  price_pending: { label: "Price pending", tone: "warning" },
  unavailable: { label: "Unavailable", tone: "neutral" },
  hidden: { label: "Unavailable", tone: "neutral" },
  archived: { label: "Unavailable", tone: "neutral" },
};

function priceLabel(priceKobo) {
  return priceKobo === null ? "Price unavailable" : formatKobo(priceKobo);
}

function nutritionPreview(nutrition) {
  const values = [
    nutrition?.calories == null ? null : formatNutritionValue("calories", nutrition.calories, { includeLabel: true }),
    nutrition?.proteinG == null ? null : formatNutritionValue("proteinG", nutrition.proteinG, { includeLabel: true }),
  ].filter(Boolean);
  return values.length ? values.join(" · ") : "Nutrition unavailable";
}

function VariantSelector({ product, variants, selectedId, onChange }) {
  if (!product.isGrouped) return null;
  const firstOrderableId = variants.find((variant) => isVariantOrderableForProduct(product, variant))?.id;
  return (
    <fieldset>
      <legend className="font-semibold text-brand-950">Choose your meal option</legend>
      <p className="mt-1 text-sm text-muted">
        {product.requiresVariantSelection ? "Select one option to continue." : "The configured default is selected when it is available."}
      </p>
      <div className="mt-3 grid gap-2">
        {variants.map((variant) => {
          const orderable = isVariantOrderableForProduct(product, variant);
          const selected = selectedId === variant.id;
          const status = statusPresentation[variant.status] || statusPresentation.unavailable;
          return (
            <label key={variant.id} className={`flex min-w-0 items-start gap-3 rounded-control border p-3 transition-colors ${selected ? "border-brand-700 bg-brand-100" : "border-line bg-surface"} ${orderable ? "cursor-pointer hover:border-brand-700" : "cursor-not-allowed opacity-70"}`}>
              <input
                type="radio"
                name={`variant-${product.id}`}
                value={variant.id}
                checked={selected}
                disabled={!orderable}
                onChange={() => onChange(variant.id)}
                className="mt-1 size-4 shrink-0 accent-brand-700"
                data-autofocus={product.requiresVariantSelection && variant.id === firstOrderableId ? "true" : undefined}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-brand-950">{variant.name}</span>
                  {product.defaultVariantId === variant.id ? <Badge tone="neutral">Default</Badge> : null}
                  {!orderable ? <Badge tone={status.tone}>{status.label}</Badge> : null}
                </span>
                <span className="mt-1 block text-sm text-muted">{priceLabel(variant.priceKobo)} · {nutritionPreview(variant.nutrition)}</span>
              </span>
              {selected ? <Check className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" /> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function AddonSelector({ addons, selectedIds, onToggle }) {
  if (!addons.length) return null;
  return (
    <fieldset>
      <legend className="font-semibold text-brand-950">Add something extra</legend>
      <p className="mt-1 text-sm text-muted">Optional. Choose as many compatible add-ons as you like.</p>
      <div className="mt-3 grid gap-2">
        {addons.map((addon) => {
          const selected = selectedIds.includes(addon.id);
          return (
            <label key={addon.id} className={`flex min-w-0 items-start gap-3 rounded-control border p-3 transition-colors ${selected ? "border-brand-700 bg-brand-100" : "border-line"} ${addon.isAvailable ? "cursor-pointer hover:border-brand-700" : "cursor-not-allowed opacity-70"}`}>
              <input type="checkbox" checked={selected} disabled={!addon.isAvailable} onChange={() => onToggle(addon.id)} className="mt-1 size-4 shrink-0 accent-brand-700" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold text-brand-950">
                  {addon.name}{!addon.isAvailable ? <Badge tone="neutral">Unavailable</Badge> : null}
                </span>
                <span className="mt-1 block text-sm text-muted">+{priceLabel(addon.priceKobo)} · {nutritionPreview(addon.nutrition)}</span>
              </span>
              {selected ? <Check className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" /> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ProductDetailDialog({ product, open, onClose, onConfigured, initialConfiguration = null, submitLabel = "Add to basket" }) {
  const customization = useProductCustomization(product, (configuration) => {
    onConfigured?.(configuration);
    onClose();
  }, initialConfiguration);
  const displaySource = product.isGrouped ? customization.selectedVariant : product;
  const displayImageUrl = displaySource?.imageUrl || product.imageUrl;
  const displayDescription = displaySource?.description || product.description;
  const displayStatus = product.isGrouped ? displaySource?.status || product.menuStatus : product.menuStatus;
  const status = statusPresentation[displayStatus] || statusPresentation.unavailable;
  const price = calculateConfiguredDisplayPrice(product, customization.variantId, customization.addonIds, customization.quantity);
  const nutrition = calculateConfiguredItemNutrition(product, customization.variantId, customization.addonIds, customization.quantity);
  const firstIssue = customization.submissionIssues[0] || customization.validation.issues[0];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={product.name}
      description={product.isGrouped ? "Choose an option and tailor this meal." : "Review the meal and tailor your selection."}
      size="large"
      contentClassName="p-5 sm:p-0"
      footerClassName="sticky bottom-0 z-10 items-center justify-between bg-surface/95 backdrop-blur"
      footer={(
        <>
          <div className="mr-auto min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Estimated total</p>
            <p className="mt-1 font-display text-2xl text-brand-950">{price.complete ? formatKobo(price.linePriceKobo) : "Price unavailable"}</p>
          </div>
          <Button size="large" disabled={!customization.validation.valid} onClick={customization.submit}>
            {submitLabel}
          </Button>
        </>
      )}
    >
      <div className="grid min-w-0 gap-6 sm:p-6 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
        <div className="min-w-0">
          <ProductImage key={displayImageUrl || "missing"} src={displayImageUrl} alt={displaySource?.name ? `${product.name}, ${displaySource.name}` : product.name} className="rounded-card sm:sticky sm:top-0 lg:aspect-square" eager />
        </div>
        <div className="min-w-0 space-y-6">
          <section aria-labelledby={`detail-overview-${product.id}`}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">{product.categoryName}</p>
              <Badge tone={status.tone}>{status.label}</Badge>
              <FavoriteButton productId={product.id} productName={product.name} />
            </div>
            <h3 id={`detail-overview-${product.id}`} className="mt-3 font-display text-3xl leading-tight text-brand-950">
              {displaySource?.name && product.isGrouped ? displaySource.name : product.name}
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted">{displayDescription || "Description coming soon."}</p>
            <p className="mt-4 text-xl font-semibold text-brand-950">{price.complete ? `${formatKobo(price.unitPriceKobo)} each` : priceLabel(displaySource?.priceKobo ?? product.priceKobo)}</p>
          </section>

          <VariantSelector product={product} variants={customization.visibleVariants} selectedId={customization.variantId} onChange={customization.chooseVariant} />
          <AddonSelector addons={customization.compatibleAddons} selectedIds={customization.addonIds} onToggle={customization.toggleAddon} />

          <section aria-labelledby={`nutrition-${product.id}`}>
            <h3 id={`nutrition-${product.id}`} className="font-semibold text-brand-950">Nutrition for this selection</h3>
            <div className="mt-3"><ConfiguredNutrition nutrition={nutrition} quantity={customization.quantity} /></div>
          </section>

          <section className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line p-4" aria-labelledby={`quantity-${product.id}`}>
            <div>
              <h3 id={`quantity-${product.id}`} className="font-semibold text-brand-950">Quantity</h3>
              <p className="mt-1 text-sm text-muted">Whole prepared meals, minimum one.</p>
            </div>
            <div className="flex items-center gap-3" role="group" aria-label={`Quantity for ${product.name}`}>
              <IconButton label="Decrease quantity" disabled={customization.quantity <= 1} onClick={customization.decrementQuantity}><Minus className="size-4" aria-hidden="true" /></IconButton>
              <output className="min-w-8 text-center text-lg font-semibold text-brand-950" aria-live="polite" aria-label={`Quantity ${customization.quantity}`}>{customization.quantity}</output>
              <IconButton label="Increase quantity" onClick={customization.incrementQuantity}><Plus className="size-4" aria-hidden="true" /></IconButton>
            </div>
          </section>

          {customization.catalogNotice ? <p className="rounded-control bg-amber-50 p-3 text-sm text-warning" role="status">{customization.catalogNotice}</p> : null}
          {firstIssue ? <p className="rounded-control bg-canvas p-3 text-sm text-muted" role="status">{firstIssue.message}</p> : null}
          <p className="text-xs leading-5 text-muted">Prices and nutrition are current display estimates. Final order values will be checked against the live menu.</p>
        </div>
      </div>
    </Dialog>
  );
}
