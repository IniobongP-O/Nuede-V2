import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema } from "@nuede/validation/catalog";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "../../../components/ui/Button.jsx";
import { Dialog } from "../../../components/ui/Dialog.jsx";
import { SelectInput, TextArea, TextInput } from "../../../components/ui/FormControls.jsx";
import { catalogErrorMessage, productFormToRecord, productToFormValues } from "../utils/catalogUtils.js";
import { AddonPicker } from "./AddonPicker.jsx";
import { CatalogImageField } from "./CatalogImageField.jsx";

/** Mounts a keyed standard-product editor so state resets between products. */
export function ProductEditorDialog(props) {
  return props.open ? <ProductEditorDialogContent {...props} /> : null;
}

/** Coordinates standard product validation, add-ons, image changes, and saving. */
function ProductEditorDialogContent({ open, onClose, product, categories, addons, mutation, onSaved }) {
  const defaultCategoryId = categories.find((category) => category.is_enabled)?.id || categories[0]?.id || "";
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: productToFormValues(product, defaultCategoryId),
  });
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const addonIds = useWatch({ control, name: "addonIds" }) || [];

  const submit = handleSubmit(async (values) => {
    try {
      const record = productFormToRecord(values);
      const saved = await mutation.mutateAsync({
        id: product?.id,
        record,
        addonIds: values.addonIds,
        imageFile,
        removeImage,
        previousImagePath: product?.image_path,
      });
      onSaved(saved);
      reset(productToFormValues(null, defaultCategoryId));
      onClose();
    } catch (error) {
      setError("root", { message: catalogErrorMessage(error) });
    }
  });

  const requestClose = () => {
    if (!isSubmitting && !mutation.isPending) onClose();
  };

  const busy = isSubmitting || mutation.isPending;

  return <Dialog open={open} onClose={requestClose} title={product ? "Edit standard meal" : "Add standard meal"} description="Manage the meal, its image, nutrition, availability, visibility, and compatible optional extras." footer={<><Button variant="ghost" onClick={requestClose} disabled={busy}>Cancel</Button><Button type="submit" form="product-editor-form" busy={busy}>{product ? "Save changes" : "Create meal"}</Button></>}><form id="product-editor-form" className="grid gap-6" onSubmit={submit} noValidate><div className="grid gap-5 sm:grid-cols-2"><TextInput label="Meal name" required autoComplete="off" error={errors.name?.message} {...register("name")} /><SelectInput label="Category" required error={errors.categoryId?.message} {...register("categoryId")}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.is_enabled ? "" : " (disabled)"}</option>)}</SelectInput></div><TextArea label="Description" help="Briefly describe the prepared meal." error={errors.description?.message} {...register("description")} /><section className="rounded-card border border-line p-4"><CatalogImageField label="Meal image" currentPath={product?.image_path} file={imageFile} onFileChange={setImageFile} removeImage={removeImage} onRemoveImageChange={setRemoveImage} disabled={busy} /></section><section className="grid gap-5 rounded-card border border-line bg-canvas p-4" aria-labelledby="product-price-status-heading"><div><h3 id="product-price-status-heading" className="font-semibold text-brand-950">Price and status</h3><p className="mt-1 text-sm text-muted">Prices are entered in NGN and stored as integer kobo.</p></div><div className="grid gap-5 sm:grid-cols-3"><TextInput label="Price (NGN)" inputMode="decimal" placeholder="6500" help="Leave blank only for Price pending." error={errors.priceNgn?.message} {...register("priceNgn")} /><SelectInput label="Availability" error={errors.availability?.message} {...register("availability")}><option value="available">Available</option><option value="sold_out">Sold out</option><option value="price_pending">Price pending</option><option value="unavailable">Unavailable</option></SelectInput><SelectInput label="Visibility" error={errors.visibility?.message} {...register("visibility")}><option value="shown">Shown</option><option value="hidden">Hidden</option><option value="archived">Archived</option></SelectInput></div></section><section className="grid gap-5 rounded-card border border-line p-4" aria-labelledby="product-nutrition-heading"><div><h3 id="product-nutrition-heading" className="font-semibold text-brand-950">Nutrition</h3><p className="mt-1 text-sm text-muted">Unknown values stay blank rather than becoming zero.</p></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><TextInput label="Calories" inputMode="numeric" placeholder="610" error={errors.calories?.message} {...register("calories")} /><TextInput label="Protein (g)" inputMode="decimal" placeholder="48" error={errors.protein?.message} {...register("protein")} /><TextInput label="Carbohydrates (g)" inputMode="decimal" placeholder="62" error={errors.carbohydrates?.message} {...register("carbohydrates")} /><TextInput label="Fat (g)" inputMode="decimal" placeholder="18" error={errors.fat?.message} {...register("fat")} /></div></section><section className="rounded-card border border-line p-4"><AddonPicker addons={addons} selectedIds={addonIds} onChange={(ids) => setValue("addonIds", ids, { shouldDirty: true, shouldValidate: true })} disabled={busy} /></section>{errors.root?.message ? <p className="rounded-control bg-red-50 p-3 text-sm text-danger" role="alert">{errors.root.message}</p> : null}</form></Dialog>;
}
