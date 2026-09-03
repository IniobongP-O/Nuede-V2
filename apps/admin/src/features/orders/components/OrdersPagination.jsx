import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "../../../components/ui/Button.jsx";
import { pageCount } from "../utils/orderUtils.js";

export function OrdersPagination({ page, pageSize, total, onPageChange, busy }) {
  const pages = pageCount(total, pageSize);
  const first = total ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, total);
  return <nav className="mt-4 flex flex-col items-center justify-between gap-3 rounded-card border border-line bg-surface p-4 sm:flex-row" aria-label="Orders pagination"><p className="text-sm text-muted">Showing {first}–{last} of {total} orders</p><div className="flex items-center gap-2"><Button size="small" variant="secondary" disabled={busy || page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="size-4" aria-hidden="true" />Previous</Button><span className="min-w-24 text-center text-sm font-semibold" aria-current="page">Page {page} of {pages}</span><Button size="small" variant="secondary" disabled={busy || page >= pages} onClick={() => onPageChange(page + 1)}>Next<ChevronRight className="size-4" aria-hidden="true" /></Button></div></nav>;
}
