import { LockKeyhole } from "lucide-react";

import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { SelectInput, TextArea, TextInput } from "../components/ui/FormControls.jsx";
import { Card, PageHeader } from "../components/ui/Surface.jsx";
import { demoOrderItems } from "../fixtures/storefrontFixtures.js";

export function CheckoutPage() {
  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <PageHeader eyebrow="Checkout" title="One last step." description="Delivery form, payment selection, and order-summary styling only. No values are calculated or submitted." />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="grid gap-6">
          <Card className="p-5 sm:p-7"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">01 · Delivery details</p><h2 className="mt-2 font-display text-3xl text-brand-950">Where should it go?</h2><p className="mt-2 text-sm text-muted">Form fields are intentionally unconnected in Cycle 1.</p></div><form className="grid gap-5 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}><TextInput label="Full name" autoComplete="name" placeholder="Your name" required /><TextInput label="Phone number" type="tel" autoComplete="tel" placeholder="0800 000 0000" required /><TextInput label="Email" type="email" autoComplete="email" placeholder="name@example.com" error="Example error styling: enter a valid email before continuing." /><SelectInput label="Delivery area" defaultValue="" required><option value="" disabled>Select a demo area</option><option>Wuse · demo</option><option>Other · demo</option></SelectInput><TextArea fieldClassName="sm:col-span-2" label="Street address" autoComplete="street-address" placeholder="Complete address" required /><TextInput fieldClassName="sm:col-span-2" label="Landmark" help="Optional fixture field" placeholder="Near a well-known location" /></form></Card>
          <Card className="p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">02 · Payment method</p><h2 className="mt-2 font-display text-3xl text-brand-950">Choose a future checkout route.</h2><div className="mt-6 grid gap-3"><div className="rounded-control border-2 border-brand-700 bg-brand-100/40 p-4"><p className="font-semibold text-brand-950">Pay with Paystack · visual example</p><p className="mt-1 text-sm text-muted">No Paystack code, secret, or initialization exists.</p></div><div className="rounded-control border border-line p-4"><p className="font-semibold text-brand-950">Continue on WhatsApp · visual example</p><p className="mt-1 text-sm text-muted">No order or message is created.</p></div></div></Card>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Demonstration order summary"><Card className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Your demo order</p><div className="mt-5 divide-y divide-line">{demoOrderItems.map((item) => <div key={item.name} className="grid grid-cols-[1fr_auto] gap-4 py-4 first:pt-0"><div><p className="text-sm font-semibold text-brand-950">{item.name}</p><p className="mt-1 text-xs text-muted">{item.detail}</p></div><span className="text-sm font-semibold">{item.price}</span></div>)}</div><dl className="border-t border-line pt-4 text-sm"><div className="flex justify-between"><dt className="text-muted">Illustrative subtotal</dt><dd>₦18,000</dd></div><div className="mt-3 flex justify-between"><dt className="text-muted">Delivery</dt><dd>Not calculated</dd></div><div className="mt-4 flex justify-between border-t border-line pt-4 text-base font-semibold"><dt>Displayed total</dt><dd>Fixture only</dd></div></dl><Button className="mt-6 w-full" disabled><LockKeyhole className="size-4" />Checkout begins in Cycle 11</Button><p className="mt-3 text-center text-xs leading-5 text-muted">This control cannot create an order or payment.</p></Card></aside>
      </div>
    </Container>
  );
}
