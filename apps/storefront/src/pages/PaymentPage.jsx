import { CheckCircle2, CircleAlert, Clock3, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge, Card, PageHeader } from "../components/ui/Surface.jsx";
import { demoPaymentStates } from "../fixtures/storefrontFixtures.js";
import { storefrontPaths } from "../app/routePaths.js";

const stateIcons = { confirming: LoaderCircle, successful: CheckCircle2, pending: Clock3, failed: CircleAlert };

export function PaymentPage() {
  const [activeId, setActiveId] = useState("confirming");
  const activeState = demoPaymentStates.find((state) => state.id === activeId);
  const ActiveIcon = stateIcons[activeId];
  return <Container className="py-12 sm:py-16 lg:py-20"><PageHeader eyebrow="Payment result" title="Clear status, calm recovery." description="Switch between mock status presentations. No payment reference, redirect, webhook, or verification logic exists." /><div className="mt-8 flex flex-wrap gap-2" aria-label="Payment state demonstration">{demoPaymentStates.map((state) => <button type="button" key={state.id} aria-pressed={state.id === activeId} onClick={() => setActiveId(state.id)} className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${state.id === activeId ? "border-brand-950 bg-brand-950 text-white" : "border-line bg-surface text-brand-950"}`}>{state.label}</button>)}</div><Card className="mt-6 grid min-h-[24rem] place-items-center p-6 text-center sm:p-10"><div className="max-w-xl"><div className="mx-auto grid size-16 place-items-center rounded-full bg-brand-100 text-brand-700"><ActiveIcon className={`size-7 ${activeId === "confirming" ? "animate-spin" : ""}`} aria-hidden="true" /></div><div className="mt-5"><Badge tone={activeState.tone}>{activeState.label} fixture</Badge></div><h2 className="mt-4 font-display text-4xl text-brand-950">{activeState.title}</h2><p className="mt-4 text-base leading-7 text-muted">{activeState.message}</p><Button className="mt-7" to={storefrontPaths.menu} variant="secondary">Return to menu shell</Button></div></Card></Container>;
}
