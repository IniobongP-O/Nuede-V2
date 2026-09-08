import { formatKobo } from "@nuede/domain/currency";
import { formatNutritionValue, NUTRITION_FIELDS } from "@nuede/domain/nutrition";
import { AlertTriangle, Minus, PackageX, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { storefrontPaths } from "../../../app/routePaths.js";
import { Button, IconButton } from "../../../components/ui/Button.jsx";
import { Dialog } from "../../../components/ui/Dialog.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/FeedbackStates.jsx";
import { Badge } from "../../../components/ui/Surface.jsx";
import { useToast } from "../../../components/ui/toastContext.js";
import { useMenu } from "../../menu/hooks/useMenu.js";
import { ProductImage } from "../../menu/components/ProductImage.jsx";
import { ProductDetailDialog } from "../../product-detail/components/ProductDetailDialog.jsx";
import { useCart } from "../context/cartContext.js";
import {
  calculateCartSubtotal,
  calculateHydratedCartNutrition,
  CART_ITEM_STATUS,
  hydrateCartItems,
} from "../utils/cartModel.js";

const emptyList = Object.freeze([]);

/** Returns persistence-aware toast copy for a completed cart action. */
function persistMessage(result, successMessage) {
  return result.persisted
    ? { message: successMessage, tone: "success" }
    : { message: `${successMessage}, but we couldn't save the change for your next visit.`, tone: "error" };
}

/** Renders a line's current price or its explicit unavailable state. */
function PriceDisplay({ item }) {
  if (!item.price.complete) return <p className="text-sm font-semibold text-warning">Current price unavailable</p>;
  return (
    <div className="text-sm">
      <p className="font-semibold text-brand-950">{formatKobo(item.price.linePriceKobo)}</p>
      <p className="text-xs text-muted">{formatKobo(item.price.unitPriceKobo)} each</p>
    </div>
  );
}

/** Renders the compact macro summary for one configured cart line. */
function LineNutrition({ nutrition }) {
  if (!nutrition.hasAny) return <p className="text-xs text-muted">Nutrition unavailable</p>;
  const values = NUTRITION_FIELDS.map(({ key, shortLabel }) => (
    `${formatNutritionValue(key, nutrition[key])}${nutrition[`${key}Complete`] ? "" : "*"}${key === "calories" ? "" : ` ${shortLabel}`}`
  ));
  return (
    <div>
      <p className="text-xs leading-5 text-muted">{values.join(" · ")}</p>
      {!nutrition.isComplete ? <p className="mt-1 text-xs font-medium text-warning">*Some nutrition details are missing</p> : null}
    </div>
  );
}

/** Maps cart availability states to badge tones. */
function statusTone(status) {
  if (status === CART_ITEM_STATUS.valid) return "success";
  if (status === CART_ITEM_STATUS.soldOut || status === CART_ITEM_STATUS.pricePending || status === CART_ITEM_STATUS.invalidAddon) return "warning";
  return "danger";
}

/** Renders one hydrated cart line and its edit, quantity, and removal actions. */
function CartLine({ item, index, onIncrement, onDecrement, onRemove, onEdit }) {
  const name = item.product?.name || "Unavailable meal";
  const quantity = item.configuration.quantity;
  const titleId = `cart-line-${index}-title`;
  return (
    <li className="rounded-card border border-line bg-surface p-4 sm:p-5" aria-labelledby={titleId}>
      <div className="grid min-w-0 gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
        {item.product ? (
          <ProductImage src={item.variant?.imageUrl || item.product.imageUrl} alt={name} className="rounded-control sm:aspect-square" />
        ) : (
          <div className="grid aspect-[4/3] place-items-center rounded-control bg-brand-100 text-brand-700 sm:aspect-square" role="img" aria-label="Unavailable meal image">
            <PackageX className="size-7" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 id={titleId} className="font-display text-xl leading-tight text-brand-950">{name}</h3>
              {item.variant ? <p className="mt-1 text-sm font-semibold text-brand-700">{item.variant.name}</p> : null}
            </div>
            <Badge tone={statusTone(item.status)}>{item.label}</Badge>
          </div>
          {item.addons.length ? <p className="mt-2 text-sm leading-6 text-muted">Add-ons: {item.addons.map((addon) => addon.name).join(", ")}</p> : null}
          {!item.orderable ? (
            <p className="mt-3 flex gap-2 rounded-control bg-amber-50 p-3 text-sm leading-5 text-warning" role="status">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{item.message}
            </p>
          ) : null}
          <div className="mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <LineNutrition nutrition={item.nutrition} />
            <PriceDisplay item={item} />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex items-center gap-2" role="group" aria-label={`Quantity for ${name}`}>
          <IconButton label={`Decrease ${name} quantity`} disabled={quantity <= 1} onClick={() => onDecrement(item)}><Minus className="size-4" aria-hidden="true" /></IconButton>
          <output className="min-w-9 text-center font-semibold text-brand-950" aria-live="polite" aria-label={`${name} quantity ${quantity}`}>{quantity}</output>
          <IconButton label={`Increase ${name} quantity`} onClick={() => onIncrement(item)}><Plus className="size-4" aria-hidden="true" /></IconButton>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.orderable ? <Button variant="ghost" size="small" onClick={() => onEdit(item)}>Edit</Button> : null}
          <Button variant="ghost" size="small" onClick={() => onRemove(item)}><Trash2 className="size-4" aria-hidden="true" />Remove</Button>
        </div>
      </div>
    </li>
  );
}

/** Renders aggregate price/nutrition and enables checkout only for a valid cart. */
function CartSummary({ items, subtotal, nutrition, onCheckout }) {
  const ready = items.length > 0 && items.every((item) => item.orderable) && subtotal.complete;
  return (
    <section className="border-t border-line bg-surface p-5 sm:p-6" aria-labelledby="basket-summary-title">
      <h3 id="basket-summary-title" className="font-display text-xl text-brand-950">Basket summary</h3>
      <div className="mt-3 flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-brand-950">Estimated subtotal</span>
        <span className="font-display text-2xl text-brand-950">{subtotal.subtotalKobo === null ? "Unavailable" : formatKobo(subtotal.subtotalKobo)}</span>
      </div>
      {!subtotal.complete ? <p className="mt-2 text-xs leading-5 text-warning">Unavailable items aren't included in this subtotal.</p> : null}
      <p className="mt-1 text-xs text-muted">Delivery is calculated at checkout.</p>

      <div className="mt-4 rounded-control bg-canvas p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Basket nutrition</p>
        {nutrition.hasAny ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {NUTRITION_FIELDS.map(({ key, label }) => (
              <div key={key}><p className="text-xs text-muted">{label}</p><p className="mt-1 font-semibold text-brand-950">{formatNutritionValue(key, nutrition[key])}{nutrition[`${key}Complete`] ? "" : "*"}</p></div>
            ))}
          </div>
        ) : <p className="mt-2 text-sm text-muted">Nutrition details are unavailable for this basket.</p>}
        {nutrition.hasAny && !nutrition.isComplete ? <p className="mt-3 text-xs leading-5 text-warning">*Some nutrition information is missing, so these totals are estimates.</p> : null}
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">We'll confirm current prices and your final total at checkout.</p>
      <div className="mt-4">
        {ready ? <Button to={`${storefrontPaths.checkout}?source=cart`} size="large" className="w-full" onClick={onCheckout}>Continue to checkout</Button> : <Button size="large" className="w-full" disabled>Resolve basket issues to continue</Button>}
      </div>
    </section>
  );
}

/** Renders and coordinates the persisted cart, live hydration, editing, and checkout. */
export function CartDialog({ open, onClose }) {
  const [clearOpen, setClearOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const cart = useCart();
  const { notify } = useToast();
  const menuQuery = useMenu();
  const products = menuQuery.data || emptyList;
  const hydratedItems = useMemo(() => hydrateCartItems(cart.items, products), [cart.items, products]);
  const subtotal = useMemo(() => calculateCartSubtotal(hydratedItems), [hydratedItems]);
  const nutrition = useMemo(() => calculateHydratedCartNutrition(hydratedItems), [hydratedItems]);
  const editProduct = editItem ? products.find((product) => product.id === editItem.configuration.productId) || null : null;

  /** Shows requested success copy or warns that the browser write failed. */
  function report(result, message) {
    const feedback = persistMessage(result, message);
    notify(feedback.message, feedback.tone);
  }

  /** Increments one line and reports persistence availability. */
  function handleIncrement(item) {
    report(cart.incrementItem(item.key), `${item.product?.name || "Meal"} quantity increased`);
  }

  /** Decrements one line and reports persistence availability. */
  function handleDecrement(item) {
    report(cart.decrementItem(item.key), `${item.product?.name || "Meal"} quantity decreased`);
  }

  /** Removes one line and reports persistence availability. */
  function handleRemove(item) {
    report(cart.removeItem(item.key), `${item.product?.name || "Unavailable meal"} removed from basket`);
  }

  /** Opens customization for the selected hydrated line. */
  function beginEdit(item) {
    setEditItem(item);
    onClose();
  }

  /** Replaces the edited line with its newly validated configuration. */
  function handleReconfigured(configuration) {
    report(cart.replaceItem(editItem.key, configuration), "Basket selection updated");
    setEditItem(null);
  }

  /** Clears every cart line after explicit customer confirmation. */
  function confirmClear() {
    report(cart.clearCart(), "Basket cleared");
    setClearOpen(false);
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} title="Your basket" description={`${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}`} size="cart" contentClassName="p-0">
        {!cart.items.length ? (
          <div className="p-5 sm:p-6"><EmptyState title="Your basket is empty" message="Choose a meal from the menu and make it your own." action={<Button to={storefrontPaths.menu} onClick={onClose}>Browse the menu</Button>} /></div>
        ) : menuQuery.isPending ? (
          <div className="p-5 sm:p-6"><LoadingState title="Checking your basket" message="Loading current meal details, prices, availability, and nutrition." /></div>
        ) : menuQuery.isError ? (
          <div className="p-5 sm:p-6"><ErrorState title="We couldn't check your basket" message="Your selections are still here. Check your connection and try again." action={<Button onClick={() => menuQuery.refetch()}>Try again</Button>} /></div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
              <p className="text-sm text-muted">Prices and availability are up to date.</p>
              <Button variant="ghost" size="small" onClick={() => setClearOpen(true)}>Clear basket</Button>
            </div>
            <ul className="grid gap-4 p-5 sm:p-6">
              {hydratedItems.map((item, index) => <CartLine key={item.key} item={item} index={index} onIncrement={handleIncrement} onDecrement={handleDecrement} onRemove={handleRemove} onEdit={beginEdit} />)}
            </ul>
            <CartSummary items={hydratedItems} subtotal={subtotal} nutrition={nutrition} onCheckout={onClose} />
          </>
        )}
      </Dialog>

      <Dialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear your basket?"
        description="This removes every meal from your basket."
        footer={<><Button variant="ghost" onClick={() => setClearOpen(false)}>Keep basket</Button><Button variant="destructive" onClick={confirmClear}>Clear basket</Button></>}
      >
        <p className="text-sm leading-6 text-muted">Saved Meals are separate and will not be affected.</p>
      </Dialog>

      {editProduct && editItem ? (
        <ProductDetailDialog
          key={editItem.key}
          product={editProduct}
          open
          onClose={() => setEditItem(null)}
          onConfigured={handleReconfigured}
          initialConfiguration={editItem.configuration}
          submitLabel="Update basket"
        />
      ) : null}
    </>
  );
}
