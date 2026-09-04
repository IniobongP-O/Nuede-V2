import { feedbackSubjects } from "@nuede/validation/content";
import { Button } from "../../../components/ui/Button.jsx";
import { SelectInput, TextInput } from "../../../components/ui/FormControls.jsx";
import { contentPageSize } from "../api/contentApi.js";

export function ContentFilters({ kind, filters, onChange, onReset }) {
  return <div className="my-6 grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <TextInput label="Search" type="search" maxLength={120} placeholder={kind === "feedback" ? "Name, email or message" : "Name or testimonial"} value={filters.search} onChange={(event) => onChange("search", event.target.value)} />
    {kind === "feedback" ? <SelectInput label="Subject" value={filters.subject} onChange={(event) => onChange("subject", event.target.value)}><option value="">All subjects</option>{feedbackSubjects.map((subject) => <option key={subject.value} value={subject.value}>{subject.label}</option>)}</SelectInput> :
      <SelectInput label="Publication" value={filters.publication} onChange={(event) => onChange("publication", event.target.value)}><option value="">All testimonials</option><option value="published">Published</option><option value="unpublished">Unpublished</option></SelectInput>}
    <SelectInput label="Rating" value={filters.rating} onChange={(event) => onChange("rating", event.target.value)}><option value="">All ratings</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} out of 5</option>)}</SelectInput>
    <Button variant="secondary" onClick={onReset}>Clear filters</Button>
  </div>;
}

export function ContentPagination({ page, count, onPage }) {
  return <nav aria-label="Content pages" className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">{count} results · Page {page + 1} of {Math.max(1, Math.ceil(count / contentPageSize))}</p><div className="flex gap-2"><Button variant="secondary" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</Button><Button variant="secondary" disabled={(page + 1) * contentPageSize >= count} onClick={() => onPage(page + 1)}>Next</Button></div></nav>;
}
