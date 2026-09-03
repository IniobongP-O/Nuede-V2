export const PLANNER_FILTERS = Object.freeze([
  Object.freeze({ id: "all", label: "All" }),
  Object.freeze({ id: "main", label: "Main" }),
  Object.freeze({ id: "sides", label: "Sides" }),
  Object.freeze({ id: "high-protein", label: "High Protein" }),
  Object.freeze({ id: "complete-macros", label: "Complete Macros" }),
]);

function categoryIdsMatching(categories, token) {
  return new Set(categories.filter((category) => `${category.slug} ${category.name}`.toLocaleLowerCase().includes(token)).map((category) => category.id));
}

export function filterPlannerProducts(products, categories, { search = "", filter = "all" } = {}) {
  const query = search.trim().toLocaleLowerCase();
  const mainCategoryIds = categoryIdsMatching(categories, "main");
  const sideCategoryIds = categoryIdsMatching(categories, "side");
  return products.filter((product) => {
    const searchable = [product.name, product.description, product.categoryName].join(" ").toLocaleLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (filter === "main" && !mainCategoryIds.has(product.categoryId)) return false;
    if (filter === "sides" && !sideCategoryIds.has(product.categoryId)) return false;
    if (filter === "high-protein" && !product.isHighProtein) return false;
    if (filter === "complete-macros" && !product.hasCompleteNutrition) return false;
    return true;
  });
}
