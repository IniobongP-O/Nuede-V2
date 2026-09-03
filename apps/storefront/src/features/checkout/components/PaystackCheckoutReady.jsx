import { formatKobo } from "@nuede/domain/currency";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "../../../components/ui/Button.jsx";
import { Card, PageHeader } from "../../../components/ui/Surface.jsx";
import { redirectToPaystackCheckout } from "../utils/paystackCheckout.js";

export function PaystackCheckoutReady({ payment, priceChanged = false }) {
  return (
    <div id="paystack-checkout-ready" tabIndex="-1" className="outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
      <PageHeader eyebrow="Secure payment" title={priceChanged ? "Your total changed before payment." : "Continue to secure checkout."} description={priceChanged ? "Nuede re-read the current menu and delivery fee. Review the authoritative total before continuing." : "Your permanent order and payment attempt are ready. Card details are handled only by Paystack."} />
      <Card as="section" className="mt-8 p-5 sm:p-8" aria-labelledby="paystack-ready-reference">
        <p className="text-sm font-semibold text-success">Permanent order created</p>
        <h2 id="paystack-ready-reference" className="mt-1 font-display text-3xl text-brand-950">{payment.orderReference}</h2>
        <dl className="mt-6 grid gap-4 rounded-control bg-canvas p-5 sm:grid-cols-2">
          <div><dt className="text-xs uppercase tracking-[0.12em] text-muted">Authoritative total</dt><dd className="mt-1 font-display text-2xl text-brand-950">{formatKobo(payment.amountKobo)}</dd></div>
          <div><dt className="text-xs uppercase tracking-[0.12em] text-muted">Payment status</dt><dd className="mt-1 font-semibold capitalize text-brand-950">Pending</dd></div>
        </dl>
        <Button className="mt-7 w-full sm:w-auto" size="large" onClick={() => redirectToPaystackCheckout(payment.authorizationUrl)}>
          Continue to Paystack<ArrowRight className="size-4" aria-hidden="true" />
        </Button>
        <p className="mt-6 flex items-start gap-2 border-t border-line pt-5 text-sm leading-6 text-muted"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />Paying is not the same as being marked paid. Nuede will verify the transaction after Paystack returns you here.</p>
      </Card>
    </div>
  );
}
