import { zodResolver } from "@hookform/resolvers/zod";
import { formatKobo, koboToNairaInput } from "@nuede/domain/currency";
import { parseNairaToKobo } from "@nuede/validation/catalog";
import { createDeliveryZoneAdminFormSchema, deliveryZoneAdminFormSchema } from "@nuede/validation/checkout";
import { MapPinned, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Dialog } from "../components/ui/Dialog.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackStates.jsx";
import { TextInput } from "../components/ui/FormControls.jsx";
import { Panel, StatusBadge } from "../components/ui/AdminPrimitives.jsx";
import { useToast } from "../components/ui/toastContext.js";
import { useAdminDeliveryZones, useCreateDeliveryZone, useDeleteDeliveryZone, useUpdateDeliveryZone } from "../features/checkout-settings/hooks/useCheckoutSettingsAdmin.js";

/** Converts a delivery mutation failure to actionable admin-facing copy. */
function deliveryMutationMessage(error, fallback) {
  if (error?.cause?.code === "23505") return "A delivery area with that name already exists.";
  if (["42501", "PGRST301"].includes(error?.cause?.code)) return "Your session is not authorized to change delivery areas.";
  return fallback;
}

/** Renders inline fee/availability editing and deletion for one delivery zone. */
function DeliveryZoneEditor({ zone, mutation, onDelete }) {
  const { notify } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(deliveryZoneAdminFormSchema),
    defaultValues: { feeNgn: koboToNairaInput(zone.fee_kobo) },
  });
  useEffect(() => { reset({ feeNgn: koboToNairaInput(zone.fee_kobo) }); }, [reset, zone.fee_kobo]);

  /** Persists the edited delivery fee for this zone. */
  function save(values) {
    mutation.mutate({ id: zone.id, feeKobo: parseNairaToKobo(values.feeNgn), isActive: zone.is_active }, {
      onSuccess: () => notify(`${zone.name} delivery fee updated.`, "success"),
      onError: () => notify("The delivery fee could not be updated.", "error"),
    });
  }

  /** Toggles whether customers may currently select this delivery zone. */
  function toggleActive() {
    mutation.mutate({ id: zone.id, feeKobo: zone.fee_kobo, isActive: !zone.is_active }, {
      onSuccess: () => notify(`${zone.name} ${zone.is_active ? "disabled" : "enabled"} for checkout.`, "success"),
      onError: () => notify("The delivery-area status could not be updated.", "error"),
    });
  }

  return (
    <li><Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-brand-950">{zone.name}</h2><StatusBadge tone={zone.is_active ? "success" : "neutral"}>{zone.is_active ? "Active" : "Inactive"}</StatusBadge></div><p className="mt-1 text-sm text-muted">Current customer fee: {formatKobo(zone.fee_kobo)}</p></div><div className="flex flex-wrap gap-2"><Button size="small" variant={zone.is_active ? "secondary" : "primary"} busy={mutation.isPending && mutation.variables?.id === zone.id} onClick={toggleActive}>{zone.is_active ? "Disable area" : "Enable area"}</Button><Button size="small" variant="ghost" onClick={() => onDelete(zone)}><Trash2 className="size-3.5" aria-hidden="true" />Delete</Button></div></div>
      <form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" noValidate onSubmit={handleSubmit(save)}><TextInput label="Delivery fee (NGN)" required inputMode="decimal" error={errors.feeNgn?.message} {...register("feeNgn")} /><Button type="submit" busy={mutation.isPending && mutation.variables?.id === zone.id}>Save fee</Button></form>
    </Panel></li>
  );
}

/** Owns validated creation of a new delivery zone. */
function AddDeliveryZoneDialog({ open, onClose, zones }) {
  const { notify } = useToast();
  const mutation = useCreateDeliveryZone();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({
    resolver: zodResolver(createDeliveryZoneAdminFormSchema),
    defaultValues: { name: "", feeNgn: "" },
  });

  /** Resets create-form state before closing the dialog. */
  function close() {
    if (mutation.isPending) return;
    reset();
    onClose();
  }

  /** Validates and creates a delivery zone with the next display order. */
  function create(values) {
    const nextSortOrder = zones.length ? Math.max(...zones.map((zone) => zone.sort_order)) + 10 : 0;
    mutation.mutate({ name: values.name, feeKobo: parseNairaToKobo(values.feeNgn), sortOrder: nextSortOrder }, {
      onSuccess: (zone) => {
        notify(`${zone.name} was added and is available at checkout.`, "success");
        reset();
        onClose();
      },
      onError: (error) => setError("root", { message: deliveryMutationMessage(error, "The delivery area could not be added.") }),
    });
  }

  return <Dialog open={open} onClose={close} title="Add delivery area" description="New areas are enabled immediately and appear at checkout with the fee entered here." footer={<><Button variant="ghost" onClick={close} disabled={mutation.isPending}>Cancel</Button><Button type="submit" form="add-delivery-zone-form" busy={mutation.isPending}>Add delivery area</Button></>}><form id="add-delivery-zone-form" className="grid gap-4" onSubmit={handleSubmit(create)} noValidate><TextInput label="Area name" required autoComplete="off" placeholder="e.g. Maitama" error={errors.name?.message} {...register("name")} /><TextInput label="Delivery fee (NGN)" required inputMode="decimal" placeholder="1800" error={errors.feeNgn?.message} {...register("feeNgn")} />{errors.root?.message ? <p className="text-sm text-danger" role="alert">{errors.root.message}</p> : null}</form></Dialog>;
}

/** Coordinates delivery-zone listing, creation, editing, activation, and deletion. */
export function DeliveryPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const query = useAdminDeliveryZones();
  const updateMutation = useUpdateDeliveryZone();
  const deleteMutation = useDeleteDeliveryZone();
  const { notify } = useToast();

  /** Deletes the selected zone after explicit administrator confirmation. */
  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        notify(`${deleteTarget.name} was permanently deleted.`, "success");
        setDeleteTarget(null);
      },
      onError: (error) => notify(deliveryMutationMessage(error, "The delivery area could not be deleted."), "error"),
    });
  }

  return (
    <><AdminPageHeader eyebrow="Operations" title="Delivery" description="Manage database-backed delivery fees and decide which areas customers can select at checkout." actions={<Button onClick={() => setCreateOpen(true)}><Plus className="size-4" aria-hidden="true" />Add delivery area</Button>} />
      <div className="mt-6">
        {query.isPending ? <LoadingState title="Loading delivery areas" message="Reading current fees and availability." /> : null}
        {query.isError ? <ErrorState title="Delivery settings are unavailable" message="No changes were made." action={<Button onClick={() => query.refetch()}>Try again</Button>} /> : null}
        {query.isSuccess && query.data.length === 0 ? <EmptyState title="No delivery areas" message="Checkout will remain unavailable until an area is added." action={<Button onClick={() => setCreateOpen(true)}>Add delivery area</Button>} /> : null}
        {query.isSuccess && query.data.length ? <><div className="mb-4 flex items-center gap-2 text-sm text-muted"><MapPinned className="size-4" aria-hidden="true" />Fees are entered in naira and stored as integer kobo.</div><ul className="grid gap-4 xl:grid-cols-2">{query.data.map((zone) => <DeliveryZoneEditor key={zone.id} zone={zone} mutation={updateMutation} onDelete={setDeleteTarget} />)}</ul></> : null}
      </div>
      <AddDeliveryZoneDialog open={createOpen} onClose={() => setCreateOpen(false)} zones={query.data || []} />
      <Dialog open={Boolean(deleteTarget)} onClose={() => { if (!deleteMutation.isPending) setDeleteTarget(null); }} title="Delete delivery area?" description="This permanently removes the area from checkout. This action cannot be undone." footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Keep area</Button><Button variant="destructive" busy={deleteMutation.isPending} onClick={confirmDelete}>Delete area</Button></>}><div className="grid gap-3 text-sm leading-6 text-muted"><p>Delete <strong className="text-brand-950">{deleteTarget?.name}</strong>?</p><p>Existing orders keep their recorded delivery-area name and fee. Customers will no longer be able to select this area.</p></div></Dialog>
    </>
  );
}
