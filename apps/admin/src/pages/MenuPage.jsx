import { FolderCog, Layers3, Plus, Puzzle } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { MetricCard } from "../components/ui/AdminPrimitives.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Dialog } from "../components/ui/Dialog.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackStates.jsx";
import { useToast } from "../components/ui/toastContext.js";
import { AddonManagerDialog } from "../features/catalog/components/AddonManagerDialog.jsx";
import { CategoryManagerDialog } from "../features/catalog/components/CategoryManagerDialog.jsx";
import { GroupedProductEditorDialog } from "../features/catalog/components/GroupedProductEditorDialog.jsx";
import { ProductEditorDialog } from "../features/catalog/components/ProductEditorDialog.jsx";
import { ProductFilters } from "../features/catalog/components/ProductFilters.jsx";
import { ProductList } from "../features/catalog/components/ProductList.jsx";
import {
  useAddons,
  useCategories,
  useCreateProduct,
  useProducts,
  useUpdateProduct,
  useUpdateProductStatus,
} from "../features/catalog/hooks/useCatalog.js";
import { catalogErrorMessage, filterProducts, nextProductStatus } from "../features/catalog/utils/catalogUtils.js";

const initialFilters = { search: "", category: "all", status: "all", type: "all" };
const emptyCatalogRecords = Object.freeze([]);

export function MenuPage() {
  const categoriesQuery = useCategories();
  const productsQuery = useProducts();
  const addonsQuery = useAddons();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const statusMutation = useUpdateProductStatus();
  const { notify } = useToast();
  const [filters, setFilters] = useState(initialFilters);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorType, setEditorType] = useState("standard");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [addonsOpen, setAddonsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [archiveProduct, setArchiveProduct] = useState(null);
  const [statusPendingId, setStatusPendingId] = useState(null);
  const statusOperationInFlight = useRef(false);

  const categories = categoriesQuery.data || emptyCatalogRecords;
  const products = productsQuery.data || emptyCatalogRecords;
  const addons = addonsQuery.data || emptyCatalogRecords;
  const filteredProducts = useMemo(() => filterProducts(products, filters), [filters, products]);
  const groupedCount = products.filter((product) => product.product_type === "grouped").length;
  const availableCount = products.filter((product) => product.status === "available").length;
  const attentionCount = products.filter((product) => ["sold_out", "price_pending", "unavailable"].includes(product.status)).length;
  const queryError = categoriesQuery.error || productsQuery.error || addonsQuery.error;
  const loading = categoriesQuery.isPending || productsQuery.isPending || addonsQuery.isPending;

  const openCreate = (type) => {
    setEditingProduct(null);
    setEditorType(type);
    setEditorOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setEditorType(product.product_type);
    setEditorOpen(true);
  };

  const applyStatusAction = async (product, action) => {
    if (statusOperationInFlight.current) return;
    statusOperationInFlight.current = true;
    setStatusPendingId(product.id);
    try {
      const status = nextProductStatus(product, action);
      await statusMutation.mutateAsync({ id: product.id, status });
      const messages = {
        mark_available: "marked available",
        mark_sold_out: "marked sold out",
        hide: "hidden",
        show: status === "price_pending" ? "shown as price pending" : status === "unavailable" ? "shown but unavailable" : "shown and available",
        restore: "restored as hidden",
      };
      notify(`${product.name} was ${messages[action]}.`);
    } catch (error) {
      notify(catalogErrorMessage(error), "error");
    } finally {
      statusOperationInFlight.current = false;
      setStatusPendingId(null);
    }
  };

  const confirmArchive = async () => {
    if (!archiveProduct || statusOperationInFlight.current) return;
    statusOperationInFlight.current = true;
    const product = archiveProduct;
    setStatusPendingId(product.id);
    try {
      await statusMutation.mutateAsync({ id: product.id, status: nextProductStatus(product, "archive") });
      notify(`${product.name} was archived.`);
      setArchiveProduct(null);
    } catch (error) {
      notify(catalogErrorMessage(error), "error");
    } finally {
      statusOperationInFlight.current = false;
      setStatusPendingId(null);
    }
  };

  const retry = () => Promise.all([categoriesQuery.refetch(), productsQuery.refetch(), addonsQuery.refetch()]);
  const closeEditor = () => setEditorOpen(false);

  return <><AdminPageHeader eyebrow="Catalog management" title="Menu" description="Construct standard meals, grouped meals, variants, shared add-ons, and Storage-backed images from one protected workspace." actions={<><Button variant="secondary" onClick={() => setCategoriesOpen(true)}><FolderCog className="size-4" aria-hidden="true" />Categories</Button><Button variant="secondary" onClick={() => setAddonsOpen(true)}><Puzzle className="size-4" aria-hidden="true" />Add-ons</Button><Button variant="secondary" onClick={() => openCreate("grouped")} disabled={!categories.length}><Layers3 className="size-4" aria-hidden="true" />Add grouped meal</Button><Button onClick={() => openCreate("standard")} disabled={!categories.length}><Plus className="size-4" aria-hidden="true" />Add standard meal</Button></>} /><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="All meals" value={String(products.length)} detail="Standard and grouped parents" /><MetricCard label="Grouped meals" value={String(groupedCount)} detail="Variants managed independently" /><MetricCard label="Available" value={String(availableCount)} detail="Currently orderable parent states" /><MetricCard label="Needs attention" value={String(attentionCount)} detail="Sold out, pending or unavailable" /></div><div className="mt-6"><ProductFilters filters={filters} categories={categories} onChange={setFilters} /></div><div className="mt-5">{loading ? <LoadingState title="Loading catalog" message="Fetching categories, products, variants, and add-ons from Supabase." /> : queryError ? <ErrorState title="Unable to load the catalog" message={catalogErrorMessage(queryError)} action={<Button variant="secondary" onClick={retry}>Try again</Button>} /> : products.length === 0 ? <EmptyState title="No meals yet" message="Create a standard or grouped meal after at least one category is available." action={<Button onClick={() => openCreate("standard")} disabled={!categories.length}>Add standard meal</Button>} /> : filteredProducts.length === 0 ? <EmptyState title="No products match these filters" message="Clear the search and filters to return to the complete menu." action={<Button variant="secondary" onClick={() => setFilters(initialFilters)}>Clear filters</Button>} /> : <ProductList products={filteredProducts} statusPendingId={statusPendingId} onEdit={openEdit} onStatusAction={applyStatusAction} onArchive={setArchiveProduct} />}</div><ProductEditorDialog open={editorOpen && editorType === "standard"} onClose={closeEditor} product={editingProduct} categories={categories} addons={addons} mutation={editingProduct ? updateMutation : createMutation} onSaved={(product) => notify(`${product.name} was ${editingProduct ? "updated" : "created"}.`)} /><GroupedProductEditorDialog open={editorOpen && editorType === "grouped"} onClose={closeEditor} product={editingProduct} categories={categories} addons={addons} onSaved={notify} /><CategoryManagerDialog open={categoriesOpen} onClose={() => setCategoriesOpen(false)} categories={categories} loading={categoriesQuery.isPending} queryError={categoriesQuery.error} /><AddonManagerDialog open={addonsOpen} onClose={() => setAddonsOpen(false)} addons={addons} onSaved={notify} /><Dialog open={Boolean(archiveProduct)} onClose={() => { if (!statusPendingId) setArchiveProduct(null); }} title={`Archive ${archiveProduct?.product_type === "grouped" ? "grouped" : "standard"} meal`} description="Archiving removes this meal from customer-facing catalog results. It can be restored later as hidden." footer={<><Button variant="ghost" onClick={() => setArchiveProduct(null)} disabled={Boolean(statusPendingId)}>Cancel</Button><Button variant="destructive" busy={Boolean(statusPendingId)} onClick={confirmArchive}>Archive meal</Button></>}><p className="text-sm leading-6 text-muted">Archive <strong className="text-brand-950">{archiveProduct?.name}</strong>? Existing historical order snapshots are unaffected.</p></Dialog></>;
}
