import { zodResolver } from "@hookform/resolvers/zod";
import { formatKobo, koboToNairaInput } from "@nuede/domain/currency";
import { parseNairaToKobo } from "@nuede/validation/catalog";
import { deliveryZoneAdminFormSchema } from "@nuede/validation/checkout";
import { MapPinned } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackStates.jsx";
import { TextInput } from "../components/ui/FormControls.jsx";
import { Panel, StatusBadge } from "../components/ui/AdminPrimitives.jsx";
import { useToast } from "../components/ui/toastContext.js";
import { useAdminDeliveryZones, useUpdateDeliveryZone } from "../features/checkout-settings/hooks/useCheckoutSettingsAdmin.js";

function DeliveryZoneEditor({ zone, mutation }) {
  const { notify } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(deliveryZoneAdminFormSchema),
    defaultValues: { feeNgn: koboToNairaInput(zone.fee_kobo) },
  });
  useEffect(() => { reset({ feeNgn: koboToNairaInput(zone.fee_kobo) }); }, [reset, zone.fee_kobo]);

  function save(values) {
    mutation.mutate({ id: zone.id, feeKobo: parseNairaToKobo(values.feeNgn), isActive: zone.is_active }, {
      onSuccess: () => notify(`${zone.name} delivery fee updated.`, "success"),
      onError: () => notify("The delivery fee could not be updated.", "error"),
    });
  }

  function toggleActive() {
    mutation.mutate({ id: zone.id, feeKobo: zone.fee_kobo, isActive: !zone.is_active }, {
      onSuccess: () => notify(`${zone.name} ${zone.is_active ? "disabled" : "enabled"} for checkout.`, "success"),
      onError: () => notify("The delivery-area status could not be updated.", "error"),
    });
  }

  return (
    <li><Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-brand-950">{zone.name}</h2><StatusBadge tone={zone.is_active ? "success" : "neutral"}>{zone.is_active ? "Active" : "Inactive"}</StatusBadge></div><p className="mt-1 text-sm text-muted">Current customer fee: {formatKobo(zone.fee_kobo)}</p></div><Button size="small" variant={zone.is_active ? "secondary" : "primary"} busy={mutation.isPending && mutation.variables?.id === zone.id} onClick={toggleActive}>{zone.is_active ? "Disable area" : "Enable area"}</Button></div>
      <form className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" noValidate onSubmit={handleSubmit(save)}><TextInput label="Delivery fee (NGN)" required inputMode="decimal" error={errors.feeNgn?.message} {...register("feeNgn")} /><Button type="submit" busy={mutation.isPending && mutation.variables?.id === zone.id}>Save fee</Button></form>
    </Panel></li>
  );
}

export function DeliveryPage() {
  const query = useAdminDeliveryZones();
  const mutation = useUpdateDeliveryZone();
  return (
    <><AdminPageHeader eyebrow="Operations" title="Delivery" description="Manage database-backed delivery fees and decide which areas customers can select at checkout." />
      <div className="mt-6">
        {query.isPending ? <LoadingState title="Loading delivery areas" message="Reading current fees and availability." /> : null}
        {query.isError ? <ErrorState title="Delivery settings are unavailable" message="No changes were made." action={<Button onClick={() => query.refetch()}>Try again</Button>} /> : null}
        {query.isSuccess && query.data.length === 0 ? <EmptyState title="No delivery areas" message="Checkout will remain unavailable until an area is configured in the database." /> : null}
        {query.isSuccess && query.data.length ? <><div className="mb-4 flex items-center gap-2 text-sm text-muted"><MapPinned className="size-4" aria-hidden="true" />Fees are entered in naira and stored as integer kobo.</div><ul className="grid gap-4 xl:grid-cols-2">{query.data.map((zone) => <DeliveryZoneEditor key={zone.id} zone={zone} mutation={mutation} />)}</ul></> : null}
      </div>
    </>
  );
}
