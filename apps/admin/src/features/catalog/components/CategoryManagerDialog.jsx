import { zodResolver } from "@hookform/resolvers/zod";
import { categoryFormSchema } from "@nuede/validation/catalog";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "../../../components/ui/Button.jsx";
import { Dialog } from "../../../components/ui/Dialog.jsx";
import { TextInput } from "../../../components/ui/FormControls.jsx";
import { useToast } from "../../../components/ui/toastContext.js";
import { useCreateCategory, useSetCategoryEnabled, useUpdateCategory } from "../hooks/useCatalog.js";
import { catalogErrorMessage } from "../utils/catalogUtils.js";

/** Renders editable category identity, order, and availability controls. */
function CategoryRow({ category, updateMutation, enableMutation }) {
  const [name, setName] = useState(category.name);
  const [sortOrder, setSortOrder] = useState(String(category.sort_order));
  const [error, setError] = useState("");
  const { notify } = useToast();
  const busy = (updateMutation.isPending && updateMutation.variables?.id === category.id)
    || (enableMutation.isPending && enableMutation.variables?.id === category.id);

  const save = async () => {
    const parsed = categoryFormSchema.safeParse({ name, sortOrder });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Review this category.");
      return;
    }
    setError("");
    try {
      await updateMutation.mutateAsync({ id: category.id, ...parsed.data });
      notify(`${parsed.data.name} was updated.`);
    } catch (mutationError) {
      setError(catalogErrorMessage(mutationError));
    }
  };

  const toggleEnabled = async () => {
    setError("");
    try {
      await enableMutation.mutateAsync({ id: category.id, isEnabled: !category.is_enabled });
      notify(`${category.name} was ${category.is_enabled ? "disabled" : "enabled"}.`);
    } catch (mutationError) {
      setError(catalogErrorMessage(mutationError));
    }
  };

  return <li className="grid gap-3 rounded-card border border-line p-4"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto]"><TextInput label={`Category name: ${category.name}`} value={name} onChange={(event) => setName(event.target.value)} disabled={busy} /><TextInput label="Display order" inputMode="numeric" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} disabled={busy} /><div className="flex items-end gap-2"><Button size="small" variant="secondary" busy={updateMutation.isPending && updateMutation.variables?.id === category.id} onClick={save}>Save</Button><Button size="small" variant="ghost" busy={enableMutation.isPending && enableMutation.variables?.id === category.id} onClick={toggleEnabled}>{category.is_enabled ? "Disable" : "Enable"}</Button></div></div><div className="flex items-center justify-between gap-3"><span className={`text-xs font-semibold ${category.is_enabled ? "text-success" : "text-muted"}`}>{category.is_enabled ? "Enabled" : "Disabled"}</span>{error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}</div></li>;
}

/** Coordinates category creation and management in one modal workflow. */
export function CategoryManagerDialog({ open, onClose, categories, loading, queryError }) {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const enableMutation = useSetCategoryEnabled();
  const { notify } = useToast();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", sortOrder: "0" },
  });

  const create = handleSubmit(async (values) => {
    try {
      const category = await createMutation.mutateAsync(values);
      notify(`${category.name} was created.`);
      reset({ name: "", sortOrder: String(category.sort_order + 10) });
    } catch (error) {
      setError("root", { message: catalogErrorMessage(error) });
    }
  });

  return <Dialog open={open} onClose={onClose} title="Manage categories" description="Create and rename categories, control their display order, and enable or disable them without changing their products."><form className="grid gap-4 rounded-card border border-line bg-canvas p-4" onSubmit={create} noValidate><h3 className="font-semibold text-brand-950">Add category</h3><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem_auto]"><TextInput label="Category name" required error={errors.name?.message} {...register("name")} /><TextInput label="Display order" required inputMode="numeric" error={errors.sortOrder?.message} {...register("sortOrder")} /><div className="flex items-end"><Button type="submit" busy={createMutation.isPending}>Add category</Button></div></div>{errors.root?.message ? <p className="text-sm text-danger" role="alert">{errors.root.message}</p> : null}</form><div className="mt-6"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-brand-950">Current categories</h3><span className="text-xs text-muted">Lower order appears first</span></div>{loading ? <p className="text-sm text-muted" role="status">Loading categories…</p> : queryError ? <p className="text-sm text-danger" role="alert">{catalogErrorMessage(queryError)}</p> : categories.length === 0 ? <p className="text-sm text-muted">No categories yet.</p> : <ul className="grid gap-3">{categories.map((category) => <CategoryRow key={`${category.id}-${category.updated_at}`} category={category} updateMutation={updateMutation} enableMutation={enableMutation} />)}</ul>}</div></Dialog>;
}
