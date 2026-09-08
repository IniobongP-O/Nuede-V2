/**
 * Coalesces realtime catalog events into bounded React Query invalidations.
 * A fixed window, rather than a trailing debounce, prevents continuous edits
 * from postponing customer-visible availability updates indefinitely.
 */
export function createCatalogInvalidator(queryClient, queryKeys, windowMs = 100) {
  let timer = null;
  let categoriesPending = false;
  let disposed = false;
  /** Schedules product refresh and optionally includes the category query. */
  function schedule(categories = false) {
    if (disposed) return;
    categoriesPending ||= categories;
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      const refreshCategories = categoriesPending;
      categoriesPending = false;
      if (refreshCategories) void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products });
    }, windowMs);
  }
  return {
    products: () => schedule(),
    categories: () => schedule(true),
    cancel: () => { disposed = true; clearTimeout(timer); timer = null; categoriesPending = false; },
  };
}
