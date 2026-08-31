import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { Panel, StatusBadge } from "../components/ui/AdminPrimitives.jsx";
import { Button } from "../components/ui/Button.jsx";
import { SelectInput, TextArea, TextInput } from "../components/ui/FormControls.jsx";
import { demoTestimonials } from "../fixtures/adminFixtures.js";

export function TestimonialsPage() {
  return <><AdminPageHeader eyebrow="Content foundation" title="Testimonials" description="List/editor composition using demonstration records. The publication workflow belongs to Cycle 17." /><div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]"><Panel className="divide-y divide-line">{demoTestimonials.map((item) => <article key={item.name} className="p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-brand-950">{item.name}</h2><StatusBadge tone={item.tone}>{item.status}</StatusBadge></div><p className="mt-2 text-xs font-semibold text-brand-700">{item.rating}</p><p className="mt-3 text-sm leading-6 text-muted">{item.excerpt}</p></article>)}</Panel><Panel className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Editor pattern</p><h2 className="mt-2 text-xl font-semibold text-brand-950">Testimonial details</h2><form className="mt-5 grid gap-5" onSubmit={(event) => event.preventDefault()}><TextInput label="Customer display name" defaultValue="Demo reviewer A" /><SelectInput label="Rating" defaultValue="5"><option value="5">5 stars · demo</option><option value="4">4 stars · demo</option></SelectInput><TextArea label="Testimonial" defaultValue="Fixture copy for layout review only." /><Button disabled>Publishing begins in Cycle 17</Button></form></Panel></div></>;
}
