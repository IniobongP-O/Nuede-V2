import { useMemo, useState } from "react";

import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, ErrorState } from "../components/ui/FeedbackStates.jsx";
import { PageHeader } from "../components/ui/Surface.jsx";
import { MenuControls } from "../features/menu/components/MenuControls.jsx";
import { MenuProductCard } from "../features/menu/components/MenuProductCard.jsx";
import { MenuSkeleton } from "../features/menu/components/MenuSkeleton.jsx";
import { useCategories, useMenu } from "../features/menu/hooks/useMenu.js";
import { useMenuRealtime } from "../features/menu/hooks/useMenuRealtime.js";
import { filterMenuProducts } from "../features/menu/utils/menuModel.js";

const emptyList = Object.freeze([]);

export function MenuPage() {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [filters, setFilters] = useState([]);
  const categoriesQuery = useCategories();
  const menuQuery = useMenu();
  useMenuRealtime();

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

  return (
    <Container className="py-10 sm:py-14 lg:py-18">
      <PageHeader eyebrow="Our menu" title="Prepared meals, made for real life." description="Explore Nuede meals, current availability, pricing, and nutrition directly from our live kitchen menu." />

      {isLoading ? <MenuSkeleton /> : null}
      {!isLoading && hasError ? (
        <ErrorState className="mt-8" title="We couldn't load the menu" message="Please check your connection and try again. The kitchen menu has not been replaced with placeholder meals." action={<Button onClick={retry}>Try again</Button>} />
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
            <EmptyState className="mt-8" title="The menu is being prepared" message="There are no customer-visible meals right now. Please check back soon." />
          ) : visibleProducts.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
              {visibleProducts.map((product) => <MenuProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <EmptyState className="mt-8" title="No meals match" message="Try a different search, category, or filter combination." action={<Button variant="secondary" onClick={resetFilters}>Show all meals</Button>} />
          )}
        </>
      ) : null}
    </Container>
  );
}
