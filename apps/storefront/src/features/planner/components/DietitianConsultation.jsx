import { PhoneCall } from "lucide-react";

/** Renders the non-clinical prompt for customers who need professional plan advice. */
export function DietitianConsultation() {
  return (
    <section
      className="rounded-card border border-brand-700/20 bg-brand-100 p-5"
      aria-labelledby="dietitian-consultation-title"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-950 text-brand-pale-yellow" aria-hidden="true">
          <PhoneCall className="size-5" />
        </span>
        <div>
          <h2 id="dietitian-consultation-title" className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
            Speak with our dietitian
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            For further consultation on your meal plan, feel free to speak with our dietitian. We’ll be happy to help you choose meals that better suit your goals and dietary needs.
          </p>
        </div>
      </div>
      <a
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-brand-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-900"
        href="tel:+2349076010745"
        aria-label="Call our dietitian at +234 907 601 0745"
      >
        <PhoneCall className="size-4" aria-hidden="true" />
        +234 907 601 0745
      </a>
    </section>
  );
}
