export function MenuSkeleton() {
  return (
    <div className="mt-10" role="status" aria-label="Loading the menu">
      <span className="sr-only">Loading the menu.</span>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-card border border-line bg-surface" aria-hidden="true">
            <div className="aspect-[4/3] animate-pulse bg-brand-100" />
            <div className="space-y-3 p-5 sm:p-6"><div className="h-3 w-24 animate-pulse rounded bg-line" /><div className="h-7 w-3/4 animate-pulse rounded bg-line" /><div className="h-4 w-full animate-pulse rounded bg-line" /><div className="h-4 w-5/6 animate-pulse rounded bg-line" /><div className="mt-5 h-12 animate-pulse rounded bg-line" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
