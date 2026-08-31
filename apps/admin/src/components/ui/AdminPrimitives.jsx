export function Panel({ as: Component = "section", className = "", children, ...props }) { return <Component className={`rounded-card border border-line bg-surface ${className}`} {...props}>{children}</Component>; }

export function MetricCard({ label, value, detail, trend }) { return <Panel className="p-5"><p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-brand-950">{value}</p><div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className="text-muted">{detail}</span>{trend ? <span className="font-semibold text-success">{trend}</span> : null}</div></Panel>; }

export function StatusBadge({ tone = "neutral", children }) { const tones = { neutral: "bg-line/60 text-brand-950", success: "bg-brand-100 text-success", warning: "bg-amber-50 text-warning", danger: "bg-red-50 text-danger" }; return <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>; }

export function FilterBar({ children }) { return <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-end">{children}</div>; }
