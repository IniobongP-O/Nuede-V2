import { zodResolver } from "@hookform/resolvers/zod";
import { formatKobo } from "@nuede/domain/currency";
import { addonFormSchema } from "@nuede/validation/catalog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "../../../components/ui/Button.jsx";
import { CheckboxField, TextInput } from "../../../components/ui/FormControls.jsx";
import { Dialog } from "../../../components/ui/Dialog.jsx";
import { useCreateAddon, useDeleteAddon, useUpdateAddon } from "../hooks/useCatalog.js";
import { addonFormToRecord, addonToFormValues, catalogErrorMessage } from "../utils/catalogUtils.js";

export function AddonManagerDialog(props) {
  return props.open ? <AddonManagerDialogContent {...props} /> : null;
}

function AddonManagerDialogContent({ open, onClose, addons, onSaved }) {
  const createMutation = useCreateAddon();
  const updateMutation = useUpdateAddon();
  const deleteMutation = useDeleteAddon();
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(addonFormSchema),
    defaultValues: addonToFormValues(null),
  });

  const edit = (addon) => {
    setEditing(addon);
    reset(addonToFormValues(addon));
  };

  const cancelEdit = () => {
    setEditing(null);
    reset(addonToFormValues(null));
  };

  const submit = handleSubmit(async (values) => {
    try {
      const record = addonFormToRecord(values);
      const saved = editing
        ? await updateMutation.mutateAsync({ id: editing.id, record })
        : await createMutation.mutateAsync(record);
      onSaved(`${saved.name} was ${editing ? "updated" : "created"}.`);
      cancelEdit();
    } catch (error) {
      setError("root", { message: catalogErrorMessage(error) });
    }
  });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const removed = await deleteMutation.mutateAsync(deleteTarget.id);
      onSaved(`${removed.name} was removed from the add-on library.`);
      if (editing?.id === deleteTarget.id) cancelEdit();
      setDeleteTarget(null);
    } catch (error) {
      onSaved(catalogErrorMessage(error), "error");
    }
  };

  const busy = isSubmitting || createMutation.isPending || updateMutation.isPending;
  return <><Dialog open={open} onClose={() => { if (!busy) onClose(); }} title="Manage add-ons" description="Create reusable optional extras, update their nutrition and integer-kobo price, or make them unavailable without changing their stable ID."><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)]"><form className="grid gap-4 rounded-card border border-line bg-canvas p-4" onSubmit={submit} noValidate><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-brand-950">{editing ? `Edit ${editing.name}` : "Create add-on"}</h3>{editing ? <Button size="small" variant="ghost" onClick={cancelEdit}>Cancel edit</Button> : null}</div><TextInput label="Add-on name" required error={errors.name?.message} {...register("name")} /><TextInput label="Price (NGN)" required inputMode="decimal" error={errors.priceNgn?.message} {...register("priceNgn")} /><div className="grid gap-4 sm:grid-cols-2"><TextInput label="Calories" inputMode="numeric" error={errors.calories?.message} {...register("calories")} /><TextInput label="Protein (g)" inputMode="decimal" error={errors.protein?.message} {...register("protein")} /><TextInput label="Carbohydrates (g)" inputMode="decimal" error={errors.carbohydrates?.message} {...register("carbohydrates")} /><TextInput label="Fat (g)" inputMode="decimal" error={errors.fat?.message} {...register("fat")} /></div><CheckboxField label="Available for selection" help="Unavailable add-ons remain assigned but are excluded from public availability." {...register("isAvailable")} />{errors.root?.message ? <p className="text-sm text-danger" role="alert">{errors.root.message}</p> : null}<Button type="submit" busy={busy}><Plus className="size-4" aria-hidden="true" />{editing ? "Save add-on" : "Create add-on"}</Button></form><section aria-labelledby="addon-library-heading"><h3 id="addon-library-heading" className="font-semibold text-brand-950">Add-on library</h3>{addons.length === 0 ? <p className="mt-3 rounded-card border border-dashed border-line p-4 text-sm text-muted">No add-ons yet.</p> : <ul className="mt-3 grid gap-3">{addons.map((addon) => <li key={addon.id} className="rounded-card border border-line p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-brand-950">{addon.name}</p><p className="mt-1 text-sm text-muted">{formatKobo(addon.price_kobo)} · {addon.is_available ? "Available" : "Unavailable"}</p><p className="mt-1 font-mono text-[0.68rem] text-muted">ID {addon.id}</p></div><div className="flex gap-1"><Button size="small" variant="ghost" onClick={() => edit(addon)}><Pencil className="size-3.5" aria-hidden="true" />Edit</Button><Button size="small" variant="ghost" onClick={() => setDeleteTarget(addon)}><Trash2 className="size-3.5" aria-hidden="true" />Remove</Button></div></div></li>)}</ul>}</section></div></Dialog><Dialog open={Boolean(deleteTarget)} onClose={() => { if (!deleteMutation.isPending) setDeleteTarget(null); }} title="Remove add-on" description="This removes the add-on and safely disassociates it from every product. Historical order snapshots remain intact." footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancel</Button><Button variant="destructive" busy={deleteMutation.isPending} onClick={confirmDelete}>Remove add-on</Button></>}><p className="text-sm text-muted">Remove <strong className="text-brand-950">{deleteTarget?.name}</strong>?</p></Dialog></>;
}
