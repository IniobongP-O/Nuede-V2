import { zodResolver } from "@hookform/resolvers/zod";
import { variantFormSchema } from "@nuede/validation/catalog";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "../../../components/ui/Button.jsx";
import { Dialog } from "../../../components/ui/Dialog.jsx";
import { SelectInput, TextArea, TextInput } from "../../../components/ui/FormControls.jsx";
import { catalogErrorMessage, variantFormToRecord, variantToFormValues } from "../utils/catalogUtils.js";
import { CatalogImageField } from "./CatalogImageField.jsx";

export function VariantEditorDialog(props) {
  return props.open ? <VariantEditorDialogContent {...props} /> : null;
}

function VariantEditorDialogContent({ open, onClose, group, variant, mutation, onSaved }) {
  const nextSortOrder = Math.max(0, ...(group?.product_variants || []).map((item) => item.sort_order)) + 10;
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(variantFormSchema),
    defaultValues: variantToFormValues(variant, nextSortOrder),
  });
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await mutation.mutateAsync({
        productId: group.id,
        id: variant?.id,
        record: variantFormToRecord(values),
        imageFile,
        removeImage,
        previousImagePath: variant?.image_path,
      });
      onSaved(saved);
      onClose();
    } catch (error) {
      setError("root", { message: catalogErrorMessage(error) });
    }
  });

  const busy = isSubmitting || mutation.isPending;
  return <Dialog open={open} onClose={() => { if (!busy) onClose(); }} title={variant ? "Edit variant" : "Add variant"} description={`Variant data is independent within ${group?.name || "this grouped meal"}. Its stable ID never changes when edited or reordered.`} footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" form="variant-editor-form" busy={busy}>{variant ? "Save variant" : "Create variant"}</Button></>}><form id="variant-editor-form" className="grid gap-5" onSubmit={submit} noValidate><TextInput label="Variant name" required error={errors.name?.message} {...register("name")} /><TextArea label="Description" error={errors.description?.message} {...register("description")} /><section className="rounded-card border border-line p-4"><CatalogImageField label="Variant image" currentPath={variant?.image_path} file={imageFile} onFileChange={setImageFile} removeImage={removeImage} onRemoveImageChange={setRemoveImage} disabled={busy} /></section><div className="grid gap-4 sm:grid-cols-2"><TextInput label="Price (NGN)" inputMode="decimal" required error={errors.priceNgn?.message} {...register("priceNgn")} /><TextInput label="Sort position" inputMode="numeric" required help="Use reorder buttons after saving for accessible adjustments." error={errors.sortOrder?.message} {...register("sortOrder")} /><SelectInput label="Availability" error={errors.availability?.message} {...register("availability")}><option value="available">Available</option><option value="sold_out">Sold out</option><option value="unavailable">Unavailable</option></SelectInput><SelectInput label="Visibility" error={errors.visibility?.message} {...register("visibility")}><option value="shown">Shown</option><option value="hidden">Hidden</option></SelectInput></div><section className="grid gap-4 rounded-card border border-line bg-canvas p-4"><div><h3 className="font-semibold text-brand-950">Variant nutrition</h3><p className="mt-1 text-sm text-muted">These values apply only to this variant.</p></div><div className="grid gap-4 sm:grid-cols-2"><TextInput label="Calories" inputMode="numeric" error={errors.calories?.message} {...register("calories")} /><TextInput label="Protein (g)" inputMode="decimal" error={errors.protein?.message} {...register("protein")} /><TextInput label="Carbohydrates (g)" inputMode="decimal" error={errors.carbohydrates?.message} {...register("carbohydrates")} /><TextInput label="Fat (g)" inputMode="decimal" error={errors.fat?.message} {...register("fat")} /></div></section>{errors.root?.message ? <p className="rounded-control bg-red-50 p-3 text-sm text-danger" role="alert">{errors.root.message}</p> : null}</form></Dialog>;
}
