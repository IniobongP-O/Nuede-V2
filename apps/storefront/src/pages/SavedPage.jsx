import { useMemo, useState } from "react";

import { storefrontPaths } from "../app/routePaths.js";
import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Dialog } from "../components/ui/Dialog.jsx";
import { EmptyState, ErrorState } from "../components/ui/FeedbackStates.jsx";
import { PageHeader } from "../components/ui/Surface.jsx";
import { useToast } from "../components/ui/toastContext.js";
import { useCart } from "../features/cart/context/cartContext.js";
import { MenuProductCard } from "../features/menu/components/MenuProductCard.jsx";
import { MenuSkeleton } from "../features/menu/components/MenuSkeleton.jsx";
import { useMenu } from "../features/menu/hooks/useMenu.js";
import { ProductDetailDialog } from "../features/product-detail/components/ProductDetailDialog.jsx";
import { useSavedMeals } from "../features/saved-meals/context/savedMealsContext.js";
import { selectSavedProducts } from "../features/saved-meals/utils/savedMealsModel.js";

const emptyList = Object.freeze([]);

/** Resolves and displays locally saved meals against the current public catalog. */
export function SavedPage() {
  const [detailProductId, setDetailProductId] = useState(null);
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const { savedMealIds, clearSavedMeals } = useSavedMeals();
  const { notify } = useToast();
  const { addItem } = useCart();
  const menuQuery = useMenu();

  const products = menuQuery.data || emptyList;
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const savedProducts = useMemo(
    () => selectSavedProducts(savedMealIds, products),
    [savedMealIds, products],
  );
  const selectedProduct = detailProductId ? productsById.get(detailProductId) || null : null;

  /** Confirms and clears every saved meal while reporting persistence failure. */
  function confirmClearAll() {
    const result = clearSavedMeals();
    setClearConfirmationOpen(false);
    setDetailProductId(null);
    notify(result.persisted ? "All saved meals cleared" : "Saved meals were cleared, but we couldn't save the change for your next visit", result.persisted ? "success" : "error");
  }

  /** Saves a configured meal to the cart and closes its editor. */
  function handleConfigured(configuration) {
    const product = productsById.get(configuration.productId);
    const result = addItem(configuration);
    const message = result.merged
      ? `${product?.name || "Meal"} quantity updated in your basket`
      : `${product?.name || "Meal"} added to your basket`;
    notify(result.persisted ? message : `${message}, but we couldn't save the change for your next visit.`, result.persisted ? "success" : "error");
  }

  const clearAction = savedMealIds.length ? (
    <Button variant="secondary" onClick={() => setClearConfirmationOpen(true)}>Clear all saved meals</Button>
  ) : null;

  return (
    <Container className="py-10 sm:py-14 lg:py-18">
      <PageHeader
        eyebrow="Saved meals"
        title="Good meals should be easy to find again."
        description="Keep your favourites close and see their latest price, nutrition, and availability whenever you return."
        actions={clearAction}
      />

      {!savedMealIds.length ? (
        <div className="mt-8 sm:mt-10">
          <EmptyState title="No meals saved yet" message="Browse the menu and use Save on any meal you would like to find quickly again." action={<Button to={storefrontPaths.menu}>Browse the menu</Button>} />
        </div>
      ) : menuQuery.isPending ? (
        <MenuSkeleton />
      ) : menuQuery.isError ? (
        <ErrorState className="mt-8" title="We couldn't load your saved meals" message="Your saved meals are still here. Check your connection and try again." action={<Button onClick={() => menuQuery.refetch()}>Try again</Button>} />
      ) : savedProducts.length ? (
        <section className="mt-8 sm:mt-10" aria-labelledby="saved-meal-list-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="saved-meal-list-heading" className="font-display text-2xl text-brand-950">Your saved meals</h2>
            <p className="text-sm text-muted">{savedProducts.length} {savedProducts.length === 1 ? "meal" : "meals"} available</p>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedProducts.map((product) => (
              <MenuProductCard key={product.id} product={product} onOpenDetails={() => setDetailProductId(product.id)} />
            ))}
          </div>
        </section>
      ) : (
        <div className="mt-8 sm:mt-10">
          <EmptyState title="Your saved meals aren't available right now" message="These meals may have left the menu. Browse what's currently available and save new favourites." action={<Button to={storefrontPaths.menu}>Browse available meals</Button>} />
        </div>
      )}

      {selectedProduct ? (
        <ProductDetailDialog
          key={selectedProduct.id}
          product={selectedProduct}
          open
          onClose={() => setDetailProductId(null)}
          onConfigured={handleConfigured}
        />
      ) : null}

      <Dialog
        open={clearConfirmationOpen}
        onClose={() => setClearConfirmationOpen(false)}
        title="Clear all saved meals?"
        description="This removes every meal from your saved list. You can save them again from the menu."
        footer={(
          <>
            <Button variant="ghost" onClick={() => setClearConfirmationOpen(false)}>Keep saved meals</Button>
            <Button variant="destructive" onClick={confirmClearAll}>Clear all</Button>
          </>
        )}
      >
        <p className="text-sm leading-6 text-muted">Your basket and meal plan won't be affected.</p>
      </Dialog>
    </Container>
  );
}
