import { useState } from "react";
import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { Panel, StatusBadge } from "../components/ui/AdminPrimitives.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Dialog } from "../components/ui/Dialog.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackStates.jsx";
import { useToast } from "../components/ui/toastContext.js";
import { ContentFilters, ContentPagination } from "../features/content/components/ContentFilters.jsx";
import { TestimonialEditor } from "../features/content/components/TestimonialEditor.jsx";
import { useContentList, useContentMutations } from "../features/content/hooks/useContent.js";

const initialFilters = { kind: "testimonials", search: "", rating: "", publication: "", page: 0 };
/** Renders testimonial search, editing, publication, pagination, and deletion. */
export function TestimonialsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [editor, setEditor] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [actionError, setActionError] = useState("");
  const query = useContentList(filters);
  const mutations = useContentMutations();
  const { notify } = useToast();
  const busy = mutations.publish.isPending || mutations.remove.isPending;
  const filtered = Boolean(filters.search || filters.rating || filters.publication);
  const reset = () => setFilters(initialFilters);
  const confirmAction = async () => {
    setActionError("");
    try {
      if (confirmation.action === "delete") await mutations.remove.mutateAsync(confirmation.item.id);
      else await mutations.publish.mutateAsync({ id: confirmation.item.id, published: !confirmation.item.is_published });
      notify(confirmation.action === "delete" ? "Testimonial deleted. Source feedback is preserved." : confirmation.item.is_published ? "Testimonial unpublished." : "Testimonial published.", "success");
      setConfirmation(null);
      setFilters((current) => ({ ...current, page: 0 }));
    } catch { setActionError("The change could not be saved. Please try again or check your admin access."); }
  };
  return <>
    <AdminPageHeader eyebrow="Customer stories" title="Testimonials" description="Review public-facing content and manage publication separately from editing." />
    <Button className="mt-4" onClick={() => setEditor({})}>Add testimonial</Button>
    <ContentFilters kind="testimonials" filters={filters} onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value, page: 0 }))} onReset={reset} />
    {query.isPending ? <LoadingState title="Loading testimonials" /> : query.isError ? <ErrorState message="Testimonials could not be loaded. Check your connection and admin access." action={<Button onClick={() => query.refetch()}>Try again</Button>} /> : <>
      {!query.data.rows.length ? <EmptyState title={filtered || filters.page ? "No testimonials match" : "No testimonials yet"} message={filtered ? "Try another search or clear the filters." : "Create an unpublished draft to get started."} action={<Button onClick={filtered || filters.page ? reset : () => setEditor({})}>{filtered || filters.page ? "Clear filters" : "Add testimonial"}</Button>} /> :
        <div className="grid gap-4 lg:grid-cols-2">{query.data.rows.map((item) => <Panel key={item.id} className="min-w-0 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="break-words font-semibold text-brand-950">{item.customer_name}</h2><StatusBadge tone={item.is_published ? "success" : "neutral"}>{item.is_published ? "Published" : "Unpublished"}</StatusBadge></div><p className="mt-2 text-sm font-semibold text-brand-700">{item.rating} out of 5</p><p className="mt-4 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-7">{item.message}</p><p className="mt-4 text-xs text-muted">Created {new Date(item.created_at).toLocaleDateString()} · Updated {new Date(item.updated_at).toLocaleDateString()}{item.source_feedback_id ? " · Copied from private feedback" : ""}</p><div className="mt-5 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setEditor(item)}>View / edit</Button><Button onClick={() => { setActionError(""); setConfirmation({ item, action: "publication" }); }}>{item.is_published ? "Unpublish" : "Publish"}</Button><Button variant="ghost" onClick={() => { setActionError(""); setConfirmation({ item, action: "delete" }); }}>Delete</Button></div></Panel>)}</div>}
      <ContentPagination page={filters.page} count={query.data.count} onPage={(page) => setFilters((current) => ({ ...current, page }))} />
    </>}
    {editor ? <TestimonialEditor testimonial={editor.id ? editor : null} mutation={mutations.save} onClose={() => setEditor(null)} onSaved={() => { notify(editor.id ? "Testimonial updated." : "Unpublished draft saved.", "success"); setFilters((current) => ({ ...current, page: 0 })); }} /> : null}
    {confirmation ? <Dialog open onClose={() => { if (!busy) setConfirmation(null); }} title={confirmation.action === "delete" ? "Delete testimonial?" : confirmation.item.is_published ? "Unpublish testimonial?" : "Publish testimonial?"} description={confirmation.action === "delete" ? "This permanently deletes this testimonial. Private source feedback and the admin audit history will remain." : confirmation.item.is_published ? "This removes the testimonial from public read results. Open storefronts refresh within 30 seconds or on window focus." : "The name, rating and message will become public. Confirm that you have reviewed and redacted the content."} footer={<><Button variant="ghost" disabled={busy} onClick={() => setConfirmation(null)}>Cancel</Button><Button variant={confirmation.action === "delete" ? "destructive" : "primary"} busy={busy} onClick={confirmAction}>Confirm {confirmation.action === "delete" ? "delete" : confirmation.item.is_published ? "unpublish" : "publish"}</Button></>}><p className="break-words font-semibold">{confirmation.item.customer_name}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{confirmation.item.message}</p>{actionError ? <p role="alert" className="mt-4 text-sm text-danger">{actionError}</p> : null}</Dialog> : null}
  </>;
}
