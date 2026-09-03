import { formatKobo } from "@nuede/domain/currency";

import { SelectInput, TextArea, TextInput } from "../../../components/ui/FormControls.jsx";
import { Card } from "../../../components/ui/Surface.jsx";

export function DeliveryDetailsSection({ register, errors, zones, disabled }) {
  return (
    <Card as="section" className="p-5 sm:p-7" aria-labelledby="delivery-details-title">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">01 · Delivery details</p>
      <h2 id="delivery-details-title" className="mt-2 font-display text-3xl text-brand-950">Where should it go?</h2>
      <p className="mt-2 text-sm leading-6 text-muted">Guest checkout is quick: tell us where and how to reach you.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <TextInput label="Full name" autoComplete="name" required disabled={disabled} error={errors.fullName?.message} {...register("fullName")} />
        <TextInput label="Phone number" type="tel" inputMode="tel" autoComplete="tel" required disabled={disabled} error={errors.phone?.message} {...register("phone")} />
        <TextInput label="Email" type="email" inputMode="email" autoComplete="email" disabled={disabled} help="Optional for this checkout stage; validated when supplied." error={errors.email?.message} {...register("email")} />
        <SelectInput label="Delivery area" required disabled={disabled} error={errors.deliveryZoneId?.message} {...register("deliveryZoneId")}>
          <option value="">Select a delivery area</option>
          {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name} · {formatKobo(zone.feeKobo)}</option>)}
        </SelectInput>
        <TextArea fieldClassName="sm:col-span-2" label="Street address" autoComplete="street-address" required disabled={disabled} error={errors.address?.message} {...register("address")} />
        <TextInput fieldClassName="sm:col-span-2" label="Landmark" autoComplete="address-line2" disabled={disabled} help="Optional — for example, a nearby gate or building." error={errors.landmark?.message} {...register("landmark")} />
      </div>
    </Card>
  );
}
