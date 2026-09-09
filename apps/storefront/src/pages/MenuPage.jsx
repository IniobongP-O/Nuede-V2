import { useMemo, useState } from "react";

import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, ErrorState } from "../components/ui/FeedbackStates.jsx";
import { PageHeader } from "../components/ui/Surface.jsx";
import { useToast } from "../components/ui/toastContext.js";
import { useCart } from "../features/cart/context/cartContext.js";
import { MenuControls } from "../features/menu/components/MenuControls.jsx";
import { MenuProductCard } from "../features/menu/components/MenuProductCard.jsx";
import { MenuSkeleton } from "../features/menu/components/MenuSkeleton.jsx";
import { useCategories, useMenu } from "../features/menu/hooks/useMenu.js";
import { filterMenuProducts } from "../features/menu/utils/menuModel.js";
import { ProductDetailDialog } from "../features/product-detail/components/ProductDetailDialog.jsx";

const emptyList = Object.freeze([]);

/** Renders the searchable public menu and owns the selected product dialog. */
export function MenuPage() {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [filters, setFilters] = useState([]);
  const [detailSelection, setDetailSelection] = useState(null);
  const { notify } = useToast();
  const { addItem } = useCart();
  const categoriesQuery = useCategories();
  const menuQuery = useMenu();

  const categories = categoriesQuery.data || emptyList;
  const products = menuQuery.data || emptyList;
  const categoryId = selectedCategoryId === "all" || categories.some((category) => category.id === selectedCategoryId)
    ? selectedCategoryId
    : "all";
  const visibleProducts = useMemo(
    () => filterMenuProducts(products, { search, categoryId, filters }),
    [products, search, categoryId, filters],
  );
  const isLoading = categoriesQuery.isPending || menuQuery.isPending;
  const hasError = categoriesQuery.isError || menuQuery.isError;
  const liveDetailProduct = detailSelection
    ? products.find((product) => product.id === detailSelection.id)
    : null;
  const selectedProduct = useMemo(
    () => liveDetailProduct || (detailSelection ? {
      ...detailSelection,
      status: "hidden",
      menuStatus: "unavailable",
      isOrderable: false,
    } : null),
    [detailSelection, liveDetailProduct],
  );

  const resetFilters = () => {
    setSearch("");
    setSelectedCategoryId("all");
    setFilters([]);
  };
  const toggleFilter = (filterId) => {
    setFilters((current) => current.includes(filterId)
      ? current.filter((item) => item !== filterId)
      : [...current, filterId]);
  };
  const retry = () => Promise.all([categoriesQuery.refetch(), menuQuery.refetch()]);
  const handleConfigured = (configuration) => {
    const configuredProduct = products.find((product) => product.id === configuration.productId);
    const result = addItem(configuration);
    const message = result.merged
      ? `${configuredProduct?.name || "Meal"} quantity updated in your basket`
      : `${configuredProduct?.name || "Meal"} added to your basket`;
    notify(result.persisted ? message : `${message}, but we couldn't save the change for your next visit.`, result.persisted ? "success" : "error");
  };

  return (
    <Container className="py-10 sm:py-14 lg:py-18">
      <PageHeader eyebrow="Our menu" title="Prepared meals, made for real life." description="Explore our meals, see what's available, and compare prices and nutrition." />

      {isLoading ? <MenuSkeleton /> : null}
      {!isLoading && hasError ? (
        <ErrorState className="mt-8" title="We couldn't load the menu" message="Please check your connection and try again." action={<Button onClick={retry}>Try again</Button>} />
      ) : null}
      {!isLoading && !hasError ? (
        <>
          <MenuControls
            categories={categories}
            search={search}
            onSearchChange={setSearch}
            categoryId={categoryId}
            onCategoryChange={setSelectedCategoryId}
            filters={filters}
            onFilterToggle={toggleFilter}
            resultCount={visibleProducts.length}
            onReset={resetFilters}
          />

          {!products.length ? (
            <EmptyState className="mt-8" title="The menu is being prepared" message="There are no meals to show right now. Please check back soon." />
          ) : visibleProducts.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
              {visibleProducts.map((product, index) => <MenuProductCard key={product.id} product={product} onOpenDetails={setDetailSelection} eager={index < 3} />)}
            </div>
          ) : (
            <EmptyState className="mt-8" title="No meals match" message="Try a different search, category, or filter combination." action={<Button variant="secondary" onClick={resetFilters}>Show all meals</Button>} />
          )}
        </>
      ) : null}
      {selectedProduct ? (
        <ProductDetailDialog
          key={selectedProduct.id}
          product={selectedProduct}
          open
          onClose={() => setDetailSelection(null)}
          onConfigured={handleConfigured}
        />
      ) : null}
    </Container>
  );
}
