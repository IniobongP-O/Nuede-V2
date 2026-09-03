import { Card } from "../../../components/ui/Surface.jsx";

export function PaymentMethodsSection({ methods, register, error, disabled }) {
  return (
    <Card as="section" className="p-5 sm:p-7" aria-labelledby="payment-method-title">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">02 · Payment method</p>
      <h2 id="payment-method-title" className="mt-2 font-display text-3xl text-brand-950">How would you like to continue?</h2>
      <fieldset className="mt-6 grid gap-3" disabled={disabled} aria-describedby={error ? "payment-method-error" : undefined}>
        <legend className="sr-only">Payment method</legend>
        {methods.map((method) => (
          <label key={method.id} className="flex cursor-pointer items-start gap-3 rounded-control border border-line p-4 has-checked:border-brand-700 has-checked:bg-brand-100/45">
            <input className="mt-1 size-4 accent-brand-700" type="radio" value={method.id} {...register("paymentMethod")} />
            <span>
              <span className="block font-semibold text-brand-950">{method.label}</span>
              <span className="mt-1 block text-sm leading-6 text-muted">{method.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {error ? <p id="payment-method-error" className="mt-3 text-sm text-danger">{error}</p> : null}
      <p className="mt-4 text-xs leading-5 text-muted">Both routes create a permanent, server-priced order first. Paystack card details stay on Paystack's hosted checkout.</p>
    </Card>
  );
}
