// A fixed window (not a trailing debounce) bounds availability latency even
// during continuous edits. Realtime remains a signal, never a data authority.
export function createCatalogInvalidator(queryClient, queryKeys, windowMs = 100) {
  let timer = null;
  let categoriesPending = false;
  let disposed = false;
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
