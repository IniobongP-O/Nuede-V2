export function AdminPageHeader({ eyebrow, title, description, actions }) {
  return <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">{title}</h1>{description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}</div>{actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}</header>;
}
