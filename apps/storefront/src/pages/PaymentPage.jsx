import { formatKobo } from "@nuede/domain/currency";
import { CheckCircle2, CircleAlert, Clock3, LoaderCircle, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { storefrontPaths } from "../app/routePaths.js";
import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge, Card, PageHeader } from "../components/ui/Surface.jsx";
import { usePaystackPayment } from "../features/checkout/hooks/usePaystackPayment.js";
import { isSafeWhatsappUrl } from "../features/checkout/utils/whatsappHandoff.js";
import { isValidPaystackReference, paymentResultState } from "../features/checkout/utils/paymentResultModel.js";

const presentations = Object.freeze({
  confirming: { icon: LoaderCircle, tone: "neutral", badge: "Confirming", title: "Confirming your payment", message: "We're confirming your payment with Paystack. This page will update automatically." },
  successful: { icon: CheckCircle2, tone: "success", badge: "Paid", title: "Payment confirmed", message: "Your payment has been confirmed. Your order details are below." },
  pending: { icon: Clock3, tone: "warning", badge: "Pending", title: "Payment pending", message: "We're still waiting for confirmation from Paystack. Please check again in a moment." },
  failed: { icon: CircleAlert, tone: "danger", badge: "Not confirmed", title: "We couldn't confirm this payment", message: "You can return to the menu and try again when you're ready." },
});

/** Reconciles a returned Paystack reference and renders its trusted payment state. */
export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") || "";
  const paymentQuery = usePaystackPayment(reference);
  const state = paymentResultState({ reference, isPending: paymentQuery.isPending, isError: paymentQuery.isError, payment: paymentQuery.data });
  const presentation = presentations[state];
  const Icon = presentation.icon;
  const payment = paymentQuery.data;
  const whatsappUrl = payment?.whatsapp?.url && isSafeWhatsappUrl(payment.whatsapp.url) ? payment.whatsapp.url : null;
  const invalidReference = !isValidPaystackReference(reference);

  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <PageHeader eyebrow="Payment status" title="Let's check your payment." description="We're confirming your payment securely with Paystack. This may take a few moments." />
      <Card className="mt-8 grid min-h-[24rem] place-items-center p-6 text-center sm:p-10" aria-live="polite">
        <div className="max-w-2xl">
          <div className={`mx-auto grid size-16 place-items-center rounded-full bg-brand-100 text-brand-700 ${state === "confirming" ? "animate-spin" : ""}`}><Icon className="size-7" aria-hidden="true" /></div>
          <div className="mt-5"><Badge tone={presentation.tone}>{presentation.badge}</Badge></div>
          <h2 className="mt-4 font-display text-4xl text-brand-950">{invalidReference ? "This payment link isn't valid" : paymentQuery.isError ? "We couldn't check this payment" : presentation.title}</h2>
          <p className="mt-4 text-base leading-7 text-muted">{invalidReference ? "This payment link is incomplete or no longer valid. Please return to the menu or use the link from your latest payment." : paymentQuery.isError ? paymentQuery.error.message : presentation.message}</p>

          {payment ? (
            <dl className="mt-7 grid gap-4 rounded-control bg-canvas p-5 text-left sm:grid-cols-3">
              <div><dt className="text-xs uppercase tracking-[0.12em] text-muted">Order number</dt><dd className="mt-1 break-words font-semibold text-brand-950">{payment.orderReference}</dd></div>
              <div><dt className="text-xs uppercase tracking-[0.12em] text-muted">Amount</dt><dd className="mt-1 font-semibold text-brand-950">{formatKobo(payment.amountKobo)}</dd></div>
              <div><dt className="text-xs uppercase tracking-[0.12em] text-muted">Payment reference</dt><dd className="mt-1 break-all text-sm font-semibold text-brand-950">{payment.paymentReference}</dd></div>
            </dl>
          ) : null}

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {["confirming", "pending"].includes(state) && !invalidReference ? <Button busy={paymentQuery.isFetching} onClick={() => paymentQuery.refetch()}><RefreshCw className="size-4" aria-hidden="true" />Check again</Button> : null}
            {state === "successful" && whatsappUrl ? <Button href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden="true" />Continue on WhatsApp</Button> : null}
            {state === "failed" ? <Button to={storefrontPaths.menu}>Return to menu</Button> : null}
            <Button to={storefrontPaths.home} variant="secondary">Go home</Button>
          </div>
          {state === "successful" ? <p className="mt-7 flex items-start justify-center gap-2 border-t border-line pt-5 text-sm leading-6 text-muted"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />Payment is confirmed. Preparation and delivery are handled separately.</p> : null}
        </div>
      </Card>
    </Container>
  );
}
