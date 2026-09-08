/** Resolves saved IDs against the current public catalog while preserving saved order. */
export function selectSavedProducts(savedMealIds = [], publicProducts = []) {
  const productsById = new Map(publicProducts.map((product) => [product.id, product]));
  return savedMealIds.flatMap((id) => productsById.get(id) || []);
}
