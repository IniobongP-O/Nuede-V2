/** Renders the standard bordered storefront content surface. */
export function Card({ as: Component = "article", className = "", children, ...props }) {
  return <Component className={`rounded-card border border-line bg-surface ${className}`} {...props}>{children}</Component>;
}

/** Renders a compact semantic status or metadata label. */
export function Badge({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-line/60 text-brand-950",
    success: "bg-brand-100 text-success",
    warning: "bg-amber-50 text-warning",
    danger: "bg-red-50 text-danger",
  };
  return <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

/** Renders a consistent heading block for page sections. */
export function SectionHeading({ eyebrow, title, description, align = "left" }) {
  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} max-w-3xl`}>
      {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">{eyebrow}</p> : null}
      <h2 className="mt-3 font-display text-3xl leading-tight text-brand-950 sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{description}</p> : null}
    </div>
  );
}

/** Renders a page-level title block with optional actions. */
export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="grid gap-6 border-b border-line pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">{eyebrow}</p> : null}
        <h1 className="mt-3 font-display text-4xl leading-[1.05] text-brand-950 sm:text-5xl lg:text-6xl">{title}</h1>
        {description ? <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
