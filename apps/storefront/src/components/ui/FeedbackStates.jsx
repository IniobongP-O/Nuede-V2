import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";

function FeedbackShell({ icon, eyebrow, title, message, action, className = "" }) {
  return (
    <section className={`rounded-card border border-line bg-surface p-6 text-center sm:p-8 ${className}`} aria-labelledby={`${eyebrow.toLowerCase()}-state-title`}>
      <div className="mx-auto mb-4 grid size-11 place-items-center rounded-full bg-brand-100 text-brand-700" aria-hidden="true">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p>
      <h2 id={`${eyebrow.toLowerCase()}-state-title`} className="mt-2 font-display text-2xl text-brand-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

export function LoadingState({ title = "Loading", message = "Preparing this view." }) {
  return <FeedbackShell icon={<LoaderCircle className="size-5 animate-spin" />} eyebrow="Loading" title={title} message={message} />;
}

export function ErrorState({ title = "Something went wrong", message = "This demo shows how a useful error and recovery action will appear.", action }) {
  return <FeedbackShell icon={<AlertTriangle className="size-5" />} eyebrow="Error" title={title} message={message} action={action} />;
}

export function EmptyState({ title, message, action }) {
  return <FeedbackShell icon={<Inbox className="size-5" />} eyebrow="Empty" title={title} message={message} action={action} />;
}

export function InlineLoading({ label = "Loading" }) {
  return <span className="inline-flex items-center gap-2 text-sm text-muted" role="status"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />{label}</span>;
}
