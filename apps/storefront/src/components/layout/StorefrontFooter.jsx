import { Sprout } from "lucide-react";
import { Link } from "react-router-dom";

import { storefrontPaths } from "../../app/routePaths.js";
import { Container } from "./Container.jsx";

export function StorefrontFooter() {
  return (
    <footer id="contact" className="border-t border-line bg-surface py-12 sm:py-16">
      <Container className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="inline-flex items-center gap-2 text-brand-950"><Sprout className="size-5 text-brand-700" aria-hidden="true" /><span className="font-display text-2xl font-bold">nuede</span></div>
          <p className="mt-4 text-sm leading-6 text-muted">Freshly prepared meals, clear nutrition, and thoughtful delivery. This Cycle 1 footer contains demonstration content only.</p>
        </div>
        <nav aria-label="Footer navigation">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Explore</p>
          <div className="mt-4 grid gap-3 text-sm font-semibold text-brand-950">
            <Link to={storefrontPaths.menu}>Menu</Link><Link to={storefrontPaths.planner}>Meal Planner</Link><Link to={storefrontPaths.saved}>Saved Meals</Link>
          </div>
        </nav>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Contact foundation</p>
          <p className="mt-4 text-sm leading-6 text-muted">Approved business contact details and social links will be added in Cycle 17.</p>
        </div>
      </Container>
      <Container className="mt-10 border-t border-line pt-6 text-xs text-muted">Nuede V2 · Cycle 1 application shell · Abuja</Container>
    </footer>
  );
}
