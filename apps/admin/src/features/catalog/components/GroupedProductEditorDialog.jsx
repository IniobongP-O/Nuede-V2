import { zodResolver } from "@hookform/resolvers/zod";
import { groupedProductOrderabilityMessage, moveVariantIds } from "@nuede/domain/catalog";
import { formatKobo } from "@nuede/domain/currency";
import { groupedProductFormSchema } from "@nuede/validation/catalog";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button, IconButton } from "../../../components/ui/Button.jsx";
import { Dialog } from "../../../components/ui/Dialog.jsx";
import { SelectInput, TextArea, TextInput } from "../../../components/ui/FormControls.jsx";
import {
  useDeleteVariant,
  useReorderVariants,
  useSaveGroupedProduct,
  useSaveVariant,
} from "../hooks/useCatalog.js";
import {
  catalogErrorMessage,
  groupedProductFormToRecord,
  groupedProductToFormValues,
} from "../utils/catalogUtils.js";
import { AddonPicker } from "./AddonPicker.jsx";
import { CatalogImageField } from "./CatalogImageField.jsx";
import { ProductStatusBadge } from "./ProductStatusBadge.jsx";
import { VariantEditorDialog } from "./VariantEditorDialog.jsx";

/** Mounts a keyed grouped-product editor so form state resets between products. */
export function GroupedProductEditorDialog(props) {
  return props.open ? <GroupedProductEditorDialogContent {...props} /> : null;
}

/** Coordinates grouped product fields, variants, add-ons, image, and save rules. */
function GroupedProductEditorDialogContent({ open, onClose, product, categories, addons, onSaved }) {
  const defaultCategoryId = categories.find((category) => category.is_enabled)?.id || categories[0]?.id || "";
  const saveGroupMutation = useSaveGroupedProduct();
  const saveVariantMutation = useSaveVariant();
  const deleteVariantMutation = useDeleteVariant();
  const reorderMutation = useReorderVariants();
  const [activeProduct, setActiveProduct] = useState(product);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [variantEditorOpen, setVariantEditorOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [deleteVariantTarget, setDeleteVariantTarget] = useState(null);
  const { register, control, handleSubmit, reset, setError, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(groupedProductFormSchema),
    defaultValues: groupedProductToFormValues(product, defaultCategoryId),
  });
  const addonIds = useWatch({ control, name: "addonIds" }) || [];
  const selectionMode = useWatch({ control, name: "selectionMode" });
  const variants = activeProduct?.product_variants || [];
  const orderableVariants = variants.filter((variant) => variant.status === "available" && Number.isSafeInteger(variant.price_kobo));

  const submit = handleSubmit(async (values) => {
    try {
      const record = groupedProductFormToRecord(values);
      const orderabilityMessage = groupedProductOrderabilityMessage(
        { ...activeProduct, ...record },
        variants,
      );
      if (orderabilityMessage) {
        setError("root", { message: orderabilityMessage });
        return;
      }
      const saved = await saveGroupMutation.mutateAsync({
        id: activeProduct?.id,
        record,
        addonIds: values.addonIds,
        imageFile,
        removeImage,
        previousImagePath: activeProduct?.image_path,
      });
      setActiveProduct(saved);
      setImageFile(null);
      setRemoveImage(false);
      reset(groupedProductToFormValues(saved, defaultCategoryId));
      onSaved(`${saved.name} was ${activeProduct ? "updated" : "created"}.`);
    } catch (error) {
      setError("root", { message: catalogErrorMessage(error) });
    }
  });

  const openVariant = (variant = null) => {
    setEditingVariant(variant);
    setVariantEditorOpen(true);
  };

  const variantSaved = (saved) => {
    setActiveProduct((current) => ({
      ...current,
      product_variants: current.product_variants.some((variant) => variant.id === saved.id)
        ? current.product_variants.map((variant) => variant.id === saved.id ? saved : variant)
        : [...current.product_variants, saved].sort((left, right) => left.sort_order - right.sort_order),
    }));
    onSaved(`${saved.name} was ${editingVariant ? "updated" : "created"}.`);
  };

  const reorder = async (variantId, direction) => {
    try {
      const saved = await reorderMutation.mutateAsync({
        productId: activeProduct.id,
        variantIds: moveVariantIds(variants, variantId, direction),
      });
      setActiveProduct(saved);
      onSaved("Variant order was updated without changing stable IDs.");
    } catch (error) {
      onSaved(catalogErrorMessage(error), "error");
    }
  };

  const confirmVariantDelete = async () => {
    if (!deleteVariantTarget) return;
    try {
      await deleteVariantMutation.mutateAsync({ productId: activeProduct.id, variant: deleteVariantTarget });
      setActiveProduct((current) => ({
        ...current,
        product_variants: current.product_variants.filter((variant) => variant.id !== deleteVariantTarget.id),
      }));
      onSaved(`${deleteVariantTarget.name} was removed.`);
      setDeleteVariantTarget(null);
    } catch (error) {
      onSaved(catalogErrorMessage(error), "error");
    }
  };

  const busy = isSubmitting || saveGroupMutation.isPending;
  return <><Dialog open={open} onClose={() => { if (!busy) onClose(); }} title={activeProduct ? "Manage grouped meal" : "Create grouped meal"} description="The parent owns shared settings and add-ons. Each child variant keeps its own price, image, nutrition, status, and stable ID." footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>Close</Button><Button type="submit" form="grouped-product-form" busy={busy}>{activeProduct ? "Save group settings" : "Create group parent"}</Button></>}><form id="grouped-product-form" className="grid gap-6" onSubmit={submit} noValidate><div className="grid gap-4 sm:grid-cols-2"><TextInput label="Group name" required error={errors.name?.message} {...register("name")} /><SelectInput label="Category" required error={errors.categoryId?.message} {...register("categoryId")}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.is_enabled ? "" : " (disabled)"}</option>)}</SelectInput></div><TextArea label="Description" error={errors.description?.message} {...register("description")} /><section className="rounded-card border border-line p-4"><CatalogImageField label="Grouped meal image" currentPath={activeProduct?.image_path} file={imageFile} onFileChange={setImageFile} removeImage={removeImage} onRemoveImageChange={setRemoveImage} disabled={busy} /></section><section className="grid gap-4 rounded-card border border-line bg-canvas p-4"><div><h3 className="font-semibold text-brand-950">Availability and selection</h3><p className="mt-1 text-sm text-muted">Available groups require at least one available priced variant.</p></div><div className="grid gap-4 sm:grid-cols-2"><SelectInput label="Availability" error={errors.availability?.message} {...register("availability")}><option value="available">Available</option><option value="sold_out">Sold out</option><option value="unavailable">Unavailable</option></SelectInput><SelectInput label="Visibility" error={errors.visibility?.message} {...register("visibility")}><option value="shown">Shown</option><option value="hidden">Hidden</option><option value="archived">Archived</option></SelectInput><SelectInput label="Customer selection mode" help="Cycle 5 stores this configuration; the customer selector remains Cycle 7." error={errors.selectionMode?.message} {...register("selectionMode")}><option value="required">Require explicit choice</option><option value="automatic" disabled={orderableVariants.length === 0}>Automatically use a default</option></SelectInput><SelectInput label="Default variant" disabled={selectionMode !== "automatic"} error={errors.defaultVariantId?.message} {...register("defaultVariantId")}><option value="">Select available variant</option>{orderableVariants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}</SelectInput></div></section><section className="rounded-card border border-line p-4"><AddonPicker addons={addons} selectedIds={addonIds} onChange={(ids) => setValue("addonIds", ids, { shouldDirty: true, shouldValidate: true })} disabled={busy} /></section>{errors.root?.message ? <p className="rounded-control bg-red-50 p-3 text-sm text-danger" role="alert">{errors.root.message}</p> : null}</form><section className="mt-8 border-t border-line pt-6" aria-labelledby="group-variants-heading"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 id="group-variants-heading" className="font-semibold text-brand-950">Variants</h3><p className="mt-1 text-sm text-muted">Use the labelled arrow buttons to reorder variants accessibly.</p></div><Button size="small" onClick={() => openVariant()} disabled={!activeProduct}><Plus className="size-4" aria-hidden="true" />Add variant</Button></div>{!activeProduct ? <p className="mt-4 rounded-control border border-dashed border-line p-4 text-sm text-muted">Create the grouped parent first, then add variants before making it available.</p> : variants.length === 0 ? <p className="mt-4 rounded-control border border-dashed border-warning/40 bg-amber-50 p-4 text-sm text-warning">This group has no variants and cannot become orderable.</p> : <ol className="mt-4 grid gap-3">{variants.map((variant, index) => <li key={variant.id} className="rounded-card border border-line p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-brand-950">{variant.name}</p><ProductStatusBadge status={variant.status} />{activeProduct.default_variant_id === variant.id ? <span className="rounded-full bg-brand-100 px-2 py-1 text-[0.68rem] font-bold text-brand-700">Default</span> : null}</div><p className="mt-1 text-sm text-muted">{formatKobo(variant.price_kobo)} · position {variant.sort_order}</p><p className="mt-1 font-mono text-[0.68rem] text-muted">ID {variant.id}</p></div><div className="flex flex-wrap gap-1"><IconButton label={`Move ${variant.name} up`} disabled={index === 0 || reorderMutation.isPending} onClick={() => reorder(variant.id, "up")}><ArrowUp className="size-4" /></IconButton><IconButton label={`Move ${variant.name} down`} disabled={index === variants.length - 1 || reorderMutation.isPending} onClick={() => reorder(variant.id, "down")}><ArrowDown className="size-4" /></IconButton><Button size="small" variant="ghost" onClick={() => openVariant(variant)}><Pencil className="size-3.5" aria-hidden="true" />Edit</Button><Button size="small" variant="ghost" onClick={() => setDeleteVariantTarget(variant)}><Trash2 className="size-3.5" aria-hidden="true" />Remove</Button></div></div></li>)}</ol>}</section></Dialog>{activeProduct ? <VariantEditorDialog open={variantEditorOpen} onClose={() => setVariantEditorOpen(false)} group={activeProduct} variant={editingVariant} mutation={saveVariantMutation} onSaved={variantSaved} /> : null}<Dialog open={Boolean(deleteVariantTarget)} onClose={() => { if (!deleteVariantMutation.isPending) setDeleteVariantTarget(null); }} title="Remove variant" description="Removal is blocked when the variant is the configured default or the final orderable variant of an available group." footer={<><Button variant="ghost" onClick={() => setDeleteVariantTarget(null)} disabled={deleteVariantMutation.isPending}>Cancel</Button><Button variant="destructive" busy={deleteVariantMutation.isPending} onClick={confirmVariantDelete}>Remove variant</Button></>}><p className="text-sm text-muted">Remove <strong className="text-brand-950">{deleteVariantTarget?.name}</strong>? Its stable ID will no longer be usable for new configurations.</p></Dialog></>;
}
