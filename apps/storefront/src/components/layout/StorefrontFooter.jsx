import { Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { storefrontPaths } from "../../app/routePaths.js";
import { getContactContent } from "../../features/content/config/storefrontContent.js";
import { Container } from "./Container.jsx";

const contact = getContactContent(import.meta.env);
export function StorefrontFooter() {
  return <footer id="contact" className="scroll-mt-24 border-t border-line bg-surface py-12 sm:py-16">
    <Container className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
      <div className="max-w-sm"><Link to="/" aria-label="Nuede home" className="inline-flex items-center gap-2 text-brand-950"><Sprout className="size-5 text-brand-700" aria-hidden="true" /><span className="font-display text-2xl font-bold">nuede</span></Link><p className="mt-4 text-sm leading-7 text-muted">Prepared meals, clear nutrition and thoughtful choices for your everyday.</p><p className="mt-3 text-sm leading-7 text-muted">{contact.serviceArea}</p></div>
      <nav aria-label="Footer navigation"><h2 className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Explore</h2><div className="mt-4 grid gap-3 text-sm font-semibold text-brand-950"><Link to={storefrontPaths.menu}>Menu</Link><Link to={storefrontPaths.planner}>Meal Planner</Link><Link to={storefrontPaths.saved}>Saved Meals</Link><a href="/#about">About Nuede</a><a href="/#faq">FAQ</a><a href="/#nutrition-note">Nutrition note</a></div></nav>
      <div><h2 className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Get in touch</h2><div className="mt-4 grid gap-3 text-sm font-semibold text-brand-950">{contact.links.map((link) => <a key={link.href} className="break-words" href={link.href} aria-label={link.ariaLabel} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined}>{link.label}</a>)}<a href="/#feedback">Send feedback or an inquiry</a></div>{contact.hours ? <p className="mt-4 text-sm leading-7 text-muted">Business hours: {contact.hours}</p> : null}</div>
    </Container><Container className="mt-10 border-t border-line pt-6 text-xs text-muted">© {new Date().getFullYear()} Nuede · Abuja</Container>
  </footer>;
}
