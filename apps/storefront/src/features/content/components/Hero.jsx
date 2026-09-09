import { ArrowLeft, ArrowRight, Pause, Play, Sprout } from "lucide-react";
import { useEffect, useState } from "react";
import { storefrontPaths } from "../../../app/routePaths.js";
import { Container } from "../../../components/layout/Container.jsx";
import { Button, IconButton } from "../../../components/ui/Button.jsx";
import { ProductImage } from "../../menu/components/ProductImage.jsx";

const slides = [
  { title: "Good food. Clear choices. Delivered.", text: "Prepared meals for everyday appetites. Explore the menu, choose your meal and make it yours with available options.", cta: "View menu", to: storefrontPaths.menu },
  { title: "A little planning. A week of good food.", text: "Bring your next 2–7 days into focus. Build a meal plan and review the nutrition of your choices before you order.", cta: "Build a meal plan", to: storefrontPaths.planner },
];

/** Renders the home-page value proposition with a live catalog preview. */
export function Hero({ products = [] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (paused || hovered || reducedMotion) return;
    const timer = window.setInterval(() => { if (!document.hidden) setActive((value) => (value + 1) % slides.length); }, 7000);
    return () => window.clearInterval(timer);
  }, [paused, hovered, reducedMotion]);
  const slide = slides[active];
  const photo = products.filter((product) => product.imageUrl)[active] || products.find((product) => product.imageUrl);
  const choose = (index) => { setActive((index + slides.length) % slides.length); setPaused(true); };
  return <section className="overflow-hidden bg-brand-950 py-14 text-white sm:py-20 lg:py-24" role="region" aria-roledescription="carousel" aria-label="Nuede highlights" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={(event) => { if (!event.target.closest("[data-rotation-control]")) setPaused(true); }}>
    <Container className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
      <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-pale-yellow">Prepared in Abuja</p>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(3rem,6.4vw,6rem)] leading-[0.98] tracking-tight">Prepared meals in Abuja, made for real life.</h1>
        <div className="min-h-[18rem] sm:min-h-[16rem]" aria-live={paused ? "polite" : "off"} aria-atomic="true"><h2 key={active} className="hero-enter mt-6 font-display text-3xl leading-tight sm:text-4xl">{slide.title}</h2><p className="mt-4 max-w-xl text-lg leading-8 text-white/80">{slide.text}</p><div className="mt-8 flex flex-wrap gap-3"><Button to={slide.to} size="large">{slide.cta}<ArrowRight className="size-4" aria-hidden="true" /></Button><Button to={active === 0 ? storefrontPaths.planner : storefrontPaths.menu} variant="secondary" size="large" className="bg-white">{active === 0 ? "Build a meal plan" : "View menu"}</Button></div></div>
        <div className="mt-6 flex flex-wrap items-center gap-3"><IconButton label="Previous highlight" onClick={() => choose(active - 1)}><ArrowLeft className="size-4" /></IconButton><IconButton label="Next highlight" onClick={() => choose(active + 1)}><ArrowRight className="size-4" /></IconButton>{slides.map((item, index) => <button key={item.to} type="button" aria-label={`Show highlight ${index + 1}: ${item.cta}`} aria-current={active === index ? "true" : undefined} onClick={() => choose(index)} className="grid size-11 place-items-center rounded-full"><span aria-hidden="true" className={`size-2.5 rounded-full ${active === index ? "bg-white" : "bg-white/40"}`} /></button>)}{!reducedMotion ? <IconButton data-rotation-control label={paused ? "Start automatic highlights" : "Pause automatic highlights"} onClick={() => setPaused((value) => !value)}>{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</IconButton> : null}</div>
      </div>
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] bg-brand-900">
        {photo ? <ProductImage key={photo.imageUrl} src={photo.imageUrl} alt={photo.name} eager className="absolute inset-0 h-full w-full" /> : <div className="p-10 text-center"><Sprout className="mx-auto size-20 text-brand-pale-yellow" aria-hidden="true" /><p className="mt-6 font-display text-4xl">Made for your everyday.</p><p className="mt-4 text-sm text-white/70">Prepared meals. Thoughtful choices.</p></div>}
      </div>
    </Container>
  </section>;
}
