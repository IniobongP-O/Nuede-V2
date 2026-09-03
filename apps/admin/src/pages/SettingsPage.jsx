import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSettingsFormSchema } from "@nuede/validation/checkout";
import { ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { Button } from "../components/ui/Button.jsx";
import { ErrorState, LoadingState } from "../components/ui/FeedbackStates.jsx";
import { CheckboxField } from "../components/ui/FormControls.jsx";
import { Panel } from "../components/ui/AdminPrimitives.jsx";
import { useToast } from "../components/ui/toastContext.js";
import { useAuth } from "../features/auth/hooks/useAuth.js";
import { useAdminCheckoutSettings, useUpdateAdminCheckoutSettings } from "../features/checkout-settings/hooks/useCheckoutSettingsAdmin.js";

export function SettingsPage() {
  const auth = useAuth();
  const { notify } = useToast();
  const query = useAdminCheckoutSettings();
  const mutation = useUpdateAdminCheckoutSettings();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ resolver: zodResolver(checkoutSettingsFormSchema), defaultValues: { paystackEnabled: false, whatsappEnabled: false } });
  const values = useWatch({ control });
  useEffect(() => {
    if (!query.data) return;
    reset({ paystackEnabled: query.data.paystack_enabled, whatsappEnabled: query.data.whatsapp_enabled });
  }, [query.data, reset]);

  function save(formValues) {
    mutation.mutate({ ...formValues, updatedBy: auth.user.id }, {
      onSuccess: () => notify("Checkout payment options updated.", "success"),
      onError: () => notify("Checkout settings could not be updated. At least one method must remain enabled.", "error"),
    });
  }

  return (
    <><AdminPageHeader eyebrow="Configuration" title="Settings" description="Control which payment routes appear in the customer checkout. This does not initialize payments or create orders." />
      <div className="mt-6 max-w-3xl">
        {query.isPending ? <LoadingState title="Loading checkout settings" message="Reading the current payment-method availability." /> : null}
        {query.isError ? <ErrorState title="Checkout settings are unavailable" message="No defaults are assumed and no changes were made." action={<Button onClick={() => query.refetch()}>Try again</Button>} /> : null}
        {query.isSuccess ? <Panel className="p-5 sm:p-7"><div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"><ShieldCheck className="size-5" aria-hidden="true" /></div><div><h2 className="text-xl font-semibold text-brand-950">Customer checkout methods</h2><p className="mt-1 text-sm leading-6 text-muted">Disabled methods disappear from checkout after its next refresh. The database rejects attempts to disable both.</p></div></div><form className="mt-6 grid gap-5" noValidate onSubmit={handleSubmit(save)}><CheckboxField label="Paystack available" help="Shows Pay with Paystack as a selectable intent. Real initialization remains Cycle 14." {...register("paystackEnabled")} /><CheckboxField label="WhatsApp available" help="Shows Continue on WhatsApp as a selectable intent. Messaging remains Cycle 13." {...register("whatsappEnabled")} />{!values.paystackEnabled && !values.whatsappEnabled ? <p className="rounded-control bg-amber-50 p-3 text-sm text-warning" role="alert">Enable at least one method before saving.</p> : null}{errors.root?.message ? <p className="text-sm text-danger" role="alert">{errors.root.message}</p> : null}<Button type="submit" busy={mutation.isPending} disabled={!values.paystackEnabled && !values.whatsappEnabled}>Save checkout settings</Button></form></Panel> : null}
      </div>
    </>
  );
}
