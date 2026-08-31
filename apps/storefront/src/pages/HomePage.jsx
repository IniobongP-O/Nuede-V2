import { ArrowRight, CalendarDays, ShieldCheck, Utensils } from "lucide-react";

import { storefrontPaths } from "../app/routePaths.js";
import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card, SectionHeading } from "../components/ui/Surface.jsx";
import { demoFaqs, demoMeals } from "../fixtures/storefrontFixtures.js";

export function HomePage() {
  return (
    <>
      <section className="py-16 sm:py-20 lg:py-28">
        <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Prepared in Abuja</p>
            <h1 className="mt-5 font-display text-[clamp(3.5rem,9vw,7rem)] leading-[0.88] tracking-[-0.045em] text-brand-950">Good food.<br />Clear choices.<br />Delivered.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted">Freshly prepared meals for real appetites and real goals—without supermarket clutter. Cycle 1 establishes the experience; ordering arrives in later cycles.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button to={storefrontPaths.menu} size="large">Explore the menu <ArrowRight className="size-4" /></Button><Button to={storefrontPaths.planner} variant="secondary" size="large">Build a meal plan</Button></div>
          </div>
          <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-brand-100 via-white to-amber-50 p-6 sm:p-8" role="img" aria-label="Decorative placeholder for approved Nuede food photography">
            <div className="absolute -right-10 -top-10 size-64 rounded-full bg-brand-700/10" />
            <div className="absolute -bottom-14 -left-10 size-72 rounded-full bg-amber-300/20" />
            <Card className="relative ml-auto mt-20 max-w-xs p-6 shadow-floating">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Image placeholder</p>
              <p className="mt-3 font-display text-2xl text-brand-950">Approved meal photography will live here.</p>
              <p className="mt-3 text-sm leading-6 text-muted">No external or production asset has been invented for this foundation cycle.</p>
            </Card>
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-surface py-8">
        <Container className="grid gap-6 sm:grid-cols-3">
          {[{ icon: Utensils, title: "Cooked for your order", text: "Prepared-meal positioning" }, { icon: CalendarDays, title: "Plan with clarity", text: "A 2–7 day foundation" }, { icon: ShieldCheck, title: "Calm checkout", text: "Trust-focused layout" }].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4"><Icon className="mt-1 size-5 text-brand-700" aria-hidden="true" /><div><p className="font-semibold text-brand-950">{title}</p><p className="mt-1 text-sm text-muted">{text}</p></div></div>
          ))}
        </Container>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6"><SectionHeading eyebrow="Today's menu" title="Meals worth looking forward to." description="Fixture cards establish image, nutrition, price, and action hierarchy. They do not connect to a menu service." /><Button to={storefrontPaths.menu} variant="ghost">View the full shell <ArrowRight className="size-4" /></Button></div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {demoMeals.slice(0, 3).map((meal) => <Card key={meal.id} className="overflow-hidden"><div className={`aspect-[4/3] bg-gradient-to-br ${meal.tone}`} aria-hidden="true" /><div className="p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">{meal.category}</p><h3 className="mt-2 font-display text-2xl text-brand-950">{meal.name}</h3><p className="mt-2 text-sm leading-6 text-muted">{meal.description}</p><div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm"><span className="font-semibold text-brand-950">{meal.price}</span><span className="text-muted">Demo</span></div></div></Card>)}
          </div>
        </Container>
      </section>

      <section id="about" className="bg-brand-950 py-16 text-white sm:py-20 lg:py-24 scroll-mt-24">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-green-300">Why Nuede</p><h2 className="mt-4 max-w-xl font-display text-4xl leading-tight sm:text-5xl">Healthy food should still feel like food.</h2></div><p className="max-w-xl text-base leading-8 text-white/70">The visual foundation pairs chef-led warmth with practical nutrition. Final brand, service-area, business-hour, and food-philosophy content belongs to Cycle 17.</p></Container>
      </section>

      <section id="faq" className="py-16 sm:py-20 lg:py-24 scroll-mt-24">
        <Container className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]"><SectionHeading eyebrow="Good to know" title="Before you order." description="A minimal native disclosure pattern reserves space for approved FAQ content later." /><div className="divide-y divide-line border-y border-line">{demoFaqs.map((item) => <details key={item.question} className="group py-5"><summary className="cursor-pointer list-none font-semibold text-brand-950 marker:hidden">{item.question}</summary><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{item.answer}</p></details>)}</div></Container>
      </section>
    </>
  );
}
