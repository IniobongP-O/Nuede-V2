import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, MapPin, Salad, Utensils } from "lucide-react";
import { productPath, storefrontPaths } from "../app/routePaths.js";
import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackStates.jsx";
import { PageHeader, SectionHeading } from "../components/ui/Surface.jsx";
import { faqs, getContactContent, nutritionDisclaimer } from "../features/content/config/storefrontContent.js";
import { MenuProductCard } from "../features/menu/components/MenuProductCard.jsx";
import { useMenu } from "../features/menu/hooks/useMenu.js";

function Page({ children }) { return <Container className="py-10 sm:py-14 lg:py-18">{children}</Container>; }

export function MealPlansPage() {
  return <Page><PageHeader eyebrow="Meal plans" title="Bring a few good days together." description="Build a flexible 2–7 day plan from the current Nuede menu and review nutrition before checkout." /><div className="mt-10 grid gap-5 md:grid-cols-3">{[
    [CalendarDays, "Choose 2–7 days", "Set the plan length that fits your week."],
    [Utensils, "Fill your meal slots", "Choose from live, currently orderable Nuede meals."],
    [Salad, "Review nutrition", "See the available calories and macros across your plan."],
  ].map(([Icon, title, text]) => <section key={title} className="rounded-card border border-line bg-surface p-6"><Icon className="size-6 text-brand-700" aria-hidden="true" /><h2 className="mt-4 font-display text-2xl text-brand-950">{title}</h2><p className="mt-2 text-sm leading-7 text-muted">{text}</p></section>)}</div><p className="mt-8 max-w-3xl text-sm leading-7 text-muted">Plans use the same live products, variants, add-ons, prices, and checkout as the rest of Nuede. Availability and delivery options are confirmed through the existing ordering flow.</p><Button to={storefrontPaths.planner} size="large" className="mt-6">Build your meal plan <ArrowRight className="size-4" /></Button></Page>;
}

export function HighProteinMealsPage() {
  const query = useMenu(); const products = (query.data || []).filter((product) => product.isHighProtein); const navigate = useNavigate();
  return <Page><PageHeader eyebrow="High-protein meals" title="Protein-forward choices from the current menu." description="Meals shown here have at least 30g of protein in their currently displayed nutrition data." />{query.isPending ? <LoadingState className="mt-8" title="Loading meals" message="Checking the current menu." /> : query.isError ? <ErrorState className="mt-8" title="We couldn't load these meals" message="Please try again." action={<Button onClick={() => query.refetch()}>Try again</Button>} /> : products.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <MenuProductCard key={product.id} product={product} onOpenDetails={(item) => navigate(productPath(item.slug))} />)}</div> : <EmptyState className="mt-8" title="No matching meals right now" message="High-protein meals appear here only when the current published nutrition supports the label." action={<Button to={storefrontPaths.menu}>View the full menu</Button>} />}<p className="mt-10 max-w-3xl text-xs leading-6 text-muted">{nutritionDisclaimer}</p></Page>;
}

export function DeliveryAbujaPage() {
  return <Page><PageHeader eyebrow="Delivery in Abuja" title="Prepared meals delivered across available Abuja areas." description="Choose your delivery area at checkout to see its current availability and fee before placing an order." /><section className="mt-10 max-w-3xl rounded-card border border-line bg-surface p-6 sm:p-8"><MapPin className="size-7 text-brand-700" aria-hidden="true" /><h2 className="mt-4 font-display text-3xl text-brand-950">How delivery works</h2><ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7 text-muted"><li>Choose and customize meals from the live menu, or build a meal plan.</li><li>Review your basket and continue to checkout.</li><li>Select one of the currently available delivery areas to see the authoritative fee.</li><li>Choose an enabled payment method and place your order.</li></ol><p className="mt-5 text-sm leading-7 text-muted">Nuede does not publish unverified neighbourhood coverage or a fixed delivery fee on this page. The current checkout options remain authoritative.</p><Button to={storefrontPaths.menu} className="mt-6">Choose a meal</Button></section></Page>;
}

export function AboutPage() {
  return <Page><PageHeader eyebrow="About Nuede" title="Food for the way you live." description="Prepared meals and practical nutrition information for everyday life in Abuja." /><div className="mt-10 grid gap-10 lg:grid-cols-2"><SectionHeading eyebrow="Our approach" title="Clear choices, thoughtfully prepared." description="Nuede brings prepared meals and practical nutrition together. Explore the live menu, compare available nutrition, customize eligible meals, or bring several days together in a meal plan." /><div className="space-y-4 text-base leading-8 text-muted"><p>We believe choosing food should be a pleasure, with enough information to find what works for your appetite and your day.</p><p>Prices, availability, variants, add-ons, delivery areas, and payment options stay connected to Nuede's live ordering system rather than being duplicated as marketing claims.</p><Button to={storefrontPaths.menu}>Explore the menu</Button></div></div></Page>;
}

export function FaqPage() {
  return <Page><PageHeader eyebrow="Frequently asked questions" title="Good to know before you order." description="Answers about delivery, meal plans, customization, nutrition, and payment." /><div className="mt-10 divide-y divide-line border-y border-line">{faqs.map((item) => <details key={item.question} className="py-5"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-brand-950">{item.question}</summary><p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{item.answer}</p></details>)}</div></Page>;
}

export function ContactPage() {
  const contact = getContactContent(import.meta.env);
  return <Page><PageHeader eyebrow="Contact Nuede" title="How can we help?" description="Use one of Nuede's configured contact options for ordering support, feedback, or a prepared-meal enquiry." /><div className="mt-10 grid gap-6 md:grid-cols-2"><section className="rounded-card border border-line bg-surface p-6"><h2 className="font-display text-2xl text-brand-950">Get in touch</h2>{contact.links.length ? <ul className="mt-4 grid gap-3">{contact.links.map((link) => <li key={link.href}><a className="font-semibold text-brand-700 underline-offset-4 hover:underline" href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined}>{link.label}</a></li>)}</ul> : <p className="mt-4 text-sm leading-7 text-muted">Current contact destinations have not yet been published here. You can still send an enquiry through the homepage feedback form.</p>}{contact.hours ? <p className="mt-5 text-sm text-muted">Business hours: {contact.hours}</p> : null}</section><section className="rounded-card border border-line bg-brand-950 p-6 text-white"><h2 className="font-display text-2xl">Service area</h2><p className="mt-4 text-sm leading-7 text-white/80">{contact.serviceArea}</p><Button to={storefrontPaths.deliveryAbuja} variant="inverse" className="mt-6">About Abuja delivery</Button></section></div><Button href="/#feedback" className="mt-8">Send feedback or an enquiry</Button></Page>;
}
