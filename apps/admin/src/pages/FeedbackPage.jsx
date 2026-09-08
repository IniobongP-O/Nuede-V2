import { subjectLabel } from "@nuede/validation/content";
import { useState } from "react";
import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { Panel } from "../components/ui/AdminPrimitives.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Dialog } from "../components/ui/Dialog.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackStates.jsx";
import { useToast } from "../components/ui/toastContext.js";
import { ContentFilters, ContentPagination } from "../features/content/components/ContentFilters.jsx";
import { TestimonialEditor } from "../features/content/components/TestimonialEditor.jsx";
import { useContentList, useContentMutations } from "../features/content/hooks/useContent.js";

const initialFilters = { kind: "feedback", search: "", subject: "", rating: "", page: 0 };
/** Renders private feedback search/filtering with testimonial-promotion actions. */
export function FeedbackPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [selected, setSelected] = useState(null);
  const [convert, setConvert] = useState(false);
  const query = useContentList(filters);
  const mutations = useContentMutations();
  const { notify } = useToast();
  const filtered = Boolean(filters.search || filters.subject || filters.rating);
  const reset = () => setFilters(initialFilters);
  return <>
    <AdminPageHeader eyebrow="Private customer inbox" title="Feedback" description="Review private submissions. Creating a testimonial copies selected content into an unpublished draft." />
    <ContentFilters kind="feedback" filters={filters} onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value, page: 0 }))} onReset={reset} />
    {query.isPending ? <LoadingState title="Loading private feedback" /> : query.isError ? <ErrorState message="Feedback could not be loaded. Check your connection and admin access." action={<Button onClick={() => query.refetch()}>Try again</Button>} /> : <>
      {!query.data.rows.length ? <EmptyState title={filtered || filters.page ? "No feedback matches" : "No feedback submissions yet"} message={filtered ? "Try another subject, rating or search." : "Customer submissions will appear here."} action={filtered || filters.page ? <Button onClick={reset}>Clear filters</Button> : null} /> :
        <div className="grid gap-4 lg:grid-cols-2">{query.data.rows.map((item) => <Panel key={item.id} className="min-w-0 p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold text-brand-950">{subjectLabel(item.subject)}</h2><span className="text-sm font-semibold text-brand-700">{item.rating} out of 5</span></div><p className="mt-3 break-words text-sm font-semibold">{item.customer_name}</p><p className="mt-1 break-all text-sm text-muted">{item.email}</p><p className="mt-4 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-7">{item.message}</p><p className="mt-3 text-xs text-muted">{new Date(item.created_at).toLocaleString()}</p><Button className="mt-4" variant="secondary" onClick={() => setSelected(item)}>Read feedback</Button></Panel>)}</div>}
      <ContentPagination page={filters.page} count={query.data.count} onPage={(page) => setFilters((current) => ({ ...current, page }))} />
    </>}
    {selected ? <Dialog open onClose={() => { if (!convert) setSelected(null); }} title={subjectLabel(selected.subject)} description="Private customer feedback" footer={<><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button><Button disabled={Boolean(selected.testimonials?.length)} onClick={() => setConvert(true)}>{selected.testimonials?.length ? "Testimonial already created" : "Create testimonial"}</Button></>}><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-muted">Customer</dt><dd className="break-words font-semibold">{selected.customer_name}</dd></div><div><dt className="text-sm text-muted">Email</dt><dd className="break-all">{selected.email}</dd></div><div><dt className="text-sm text-muted">Rating</dt><dd>{selected.rating} out of 5</dd></div><div><dt className="text-sm text-muted">Submitted</dt><dd>{new Date(selected.created_at).toLocaleString()}</dd></div></dl><p className="mt-4 text-sm text-muted">{selected.testimonials?.length ? "A testimonial has been copied from this feedback. Manage its publication in Testimonials." : "No testimonial has been created from this feedback."}</p><p className="mt-6 whitespace-pre-wrap break-words text-sm leading-7">{selected.message}</p></Dialog> : null}
    {convert && selected ? <TestimonialEditor feedback={selected} mutation={mutations.save} onClose={() => setConvert(false)} onSaved={(saved) => { setSelected((current) => ({ ...current, testimonials: [saved] })); notify("Unpublished draft saved. Review and publish it separately in Testimonials.", "success"); }} /> : null}
  </>;
}
