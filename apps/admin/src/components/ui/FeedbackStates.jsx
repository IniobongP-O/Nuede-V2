import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";

function State({ icon, label, title, message, action }) {
  return <section className="rounded-card border border-line bg-surface p-6 text-center" aria-labelledby={`${label}-state-heading`}><div className="mx-auto grid size-10 place-items-center rounded-full bg-brand-100 text-brand-700" aria-hidden="true">{icon}</div><p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{label}</p><h2 id={`${label}-state-heading`} className="mt-2 text-xl font-semibold text-brand-950">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{message}</p>{action ? <div className="mt-5">{action}</div> : null}</section>;
}

export function LoadingState({ title = "Loading view", message = "Preparing operational content." }) { return <State icon={<LoaderCircle className="size-5 animate-spin" />} label="loading" title={title} message={message} />; }
export function ErrorState({ title = "Unable to load this panel", message = "This is the reusable error and recovery pattern.", action }) { return <State icon={<AlertTriangle className="size-5" />} label="error" title={title} message={message} action={action} />; }
export function EmptyState({ title, message, action }) { return <State icon={<Inbox className="size-5" />} label="empty" title={title} message={message} action={action} />; }
