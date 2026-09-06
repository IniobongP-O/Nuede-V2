import { formatKobo } from "@nuede/domain/currency";
import { CheckCircle2, ExternalLink, MessageCircle, ShieldCheck } from "lucide-react";

import { Button } from "../../../components/ui/Button.jsx";
import { Card, PageHeader } from "../../../components/ui/Surface.jsx";
import { isSafeWhatsappUrl } from "../utils/whatsappHandoff.js";

export function WhatsappOrderCreated({ order }) {
  const safeUrl = order.whatsapp?.url && isSafeWhatsappUrl(order.whatsapp.url) ? order.whatsapp.url : null;
  return (
    <div id="whatsapp-order-created" tabIndex="-1" className="outline-none focus-visible:ring-2 focus-visible:ring-brand-700" role="status">
      <PageHeader eyebrow="Order created" title="Your order is ready on WhatsApp." description="Continue on WhatsApp to confirm the next steps and payment. This order is not yet paid." />
      <Card as="section" className="mt-8 overflow-hidden p-5 sm:p-8" aria-labelledby="whatsapp-order-reference">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-6" aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-success">Order number</p>
            <h2 id="whatsapp-order-reference" className="mt-1 break-words font-display text-3xl text-brand-950 sm:text-4xl">{order.orderReference}</h2>
          </div>
        </div>
        <dl className="mt-7 grid gap-4 rounded-control bg-canvas p-5 sm:grid-cols-3">
          <div><dt className="text-xs uppercase tracking-[0.12em] text-muted">Final total</dt><dd className="mt-1 font-display text-2xl text-brand-950">{formatKobo(order.totalKobo)}</dd></div>
          <div><dt className="text-xs uppercase tracking-[0.12em] text-muted">Payment</dt><dd className="mt-1 font-semibold capitalize text-brand-950">{order.paymentStatus}</dd></div>
          <div><dt className="text-xs uppercase tracking-[0.12em] text-muted">Order status</dt><dd className="mt-1 font-semibold capitalize text-brand-950">{order.fulfilmentStatus}</dd></div>
        </dl>
        {safeUrl ? (
          <div className="mt-7">
            <Button href={safeUrl} target="_blank" rel="noopener noreferrer" size="large" className="w-full sm:w-auto">
              <MessageCircle className="size-5" aria-hidden="true" />Open WhatsApp<ExternalLink className="size-4" aria-hidden="true" />
            </Button>
            <p className="mt-3 text-sm leading-6 text-muted">If WhatsApp did not open automatically, use this button. It reopens the same saved order and will not create another one.</p>
          </div>
        ) : (
          <div className="mt-7 rounded-control border border-amber-200 bg-amber-50 p-4" role="alert">
            <p className="font-semibold text-warning">We couldn't open WhatsApp.</p>
            <p className="mt-1 text-sm leading-6 text-warning">Your order is saved. Keep order number <strong>{order.orderReference}</strong> and contact us for help.</p>
          </div>
        )}
        <p className="mt-7 flex items-start gap-2 border-t border-line pt-5 text-sm leading-6 text-muted"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />The total shown above is the final total for this order.</p>
      </Card>
    </div>
  );
}
