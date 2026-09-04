import { ArrowRight, CalendarDays, SlidersHorizontal, Utensils } from "lucide-react";
import { storefrontPaths } from "../app/routePaths.js";
import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { SectionHeading } from "../components/ui/Surface.jsx";
import { FeaturedMeals } from "../features/content/components/FeaturedMeals.jsx";
import { FeedbackForm } from "../features/content/components/FeedbackForm.jsx";
import { Hero } from "../features/content/components/Hero.jsx";
import { Testimonials } from "../features/content/components/Testimonials.jsx";
import { faqs, nutritionDisclaimer } from "../features/content/config/storefrontContent.js";
import { useMenu } from "../features/menu/hooks/useMenu.js";

export function HomePage() {
  const menu = useMenu();
  return <>
    <Hero products={menu.data} />
    <section className="border-b border-line bg-surface py-8"><Container className="grid gap-6 sm:grid-cols-3">{[
      { icon: Utensils, title: "Prepared meals", text: "Explore our current kitchen menu" },
      { icon: SlidersHorizontal, title: "Make it yours", text: "Choose available options and add-ons" },
      { icon: CalendarDays, title: "Plan ahead", text: "Bring 2–7 days of meals together" },
    ].map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-4"><Icon className="mt-1 size-5 shrink-0 text-brand-700" aria-hidden="true" /><div><p className="font-semibold text-brand-950">{title}</p><p className="mt-1 text-sm text-muted">{text}</p></div></div>)}</Container></section>
    <section className="py-16 sm:py-20"><Container><div className="flex flex-wrap items-end justify-between gap-6"><SectionHeading eyebrow="From the kitchen" title="Meals worth looking forward to." description="Discover meals from our live menu, with current prices, availability and nutrition." /><Button to={storefrontPaths.menu} variant="ghost">View the full menu <ArrowRight className="size-4" aria-hidden="true" /></Button></div><div className="mt-8"><FeaturedMeals query={menu} /></div></Container></section>
    <section id="about" className="scroll-mt-24 bg-brand-950 py-16 text-white sm:py-20"><Container className="grid items-center gap-10 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-pale-yellow">About Nuede</p><h2 className="mt-4 max-w-xl font-display text-4xl leading-tight sm:text-5xl">Food for the way you live.</h2></div><div className="max-w-xl space-y-4 text-base leading-8 text-white/80"><p>Nuede brings prepared meals and practical nutrition together in Abuja. We believe choosing food should be a pleasure, with enough information to find what works for your appetite and your day.</p><p>Explore our meals, compare the available nutrition and customize eligible options. Order for today or bring several days together in a meal plan, then review delivery options at checkout.</p><Button to={storefrontPaths.menu} className="mt-2">Find your next meal</Button></div></Container></section>
    <section className="py-16 sm:py-20"><Container><SectionHeading eyebrow="Customer stories" title="From the people at our table." description="Published feedback, shared with care." /><div className="mt-8"><Testimonials /></div></Container></section>
    <section id="faq" className="scroll-mt-24 border-y border-line bg-surface py-16 sm:py-20"><Container className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]"><SectionHeading eyebrow="Good to know" title="Before you order." description="A few answers to help you choose, plan and check out." /><div className="divide-y divide-line border-y border-line">{faqs.map((item) => <details key={item.question} className="group py-5"><summary className="min-h-11 cursor-pointer py-2 font-semibold text-brand-950">{item.question}</summary><p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{item.answer}</p></details>)}</div></Container></section>
    <section id="nutrition-note" className="scroll-mt-24 py-12"><Container><h2 className="font-display text-2xl text-brand-950">A note on nutrition</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{nutritionDisclaimer}</p></Container></section>
    <Container className="pb-16 sm:pb-20"><div className="max-w-3xl rounded-card border border-line bg-surface p-6 sm:p-8"><FeedbackForm /></div></Container>
  </>;
}
