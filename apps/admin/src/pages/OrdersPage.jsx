import { useDeferredValue, useEffect, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import { hasActiveOrderFilters, normalizeOrdersPage } from "@nuede/domain/orders";
import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackStates.jsx";
import { OrderFilters } from "../features/orders/components/OrderFilters.jsx";
import { OrdersList } from "../features/orders/components/OrdersList.jsx";
import { OrdersPagination } from "../features/orders/components/OrdersPagination.jsx";
import { useOrders } from "../features/orders/hooks/useOrders.js";
import { orderErrorMessage, pageCount } from "../features/orders/utils/orderUtils.js";

const pageSize = 20;

function filtersFromParams(params) {
  return {
    search: params.get("search") || "",
    fulfilmentStatus: params.get("fulfilment") || "",
    paymentStatus: params.get("payment") || "",
    paymentMethod: params.get("method") || "",
    orderType: params.get("type") || "",
    dateFrom: params.get("from") || "",
    dateTo: params.get("to") || "",
  };
}

const filterParamNames = {
  search: "search",
  fulfilmentStatus: "fulfilment",
  paymentStatus: "payment",
  paymentMethod: "method",
  orderType: "type",
  dateFrom: "from",
  dateTo: "to",
};

export function OrdersPage() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const paramsText = params.toString();
  const urlFilters = useMemo(() => filtersFromParams(new URLSearchParams(paramsText)), [paramsText]);
  const deferredSearch = useDeferredValue(urlFilters.search);
  const page = normalizeOrdersPage(params.get("page"));
  const filters = useMemo(() => ({ ...urlFilters, search: deferredSearch, page, pageSize }), [urlFilters, deferredSearch, page]);
  const query = useOrders(filters);

  useEffect(() => {
    if (!query.data?.total || page <= pageCount(query.data.total, pageSize)) return;
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set("page", String(pageCount(query.data.total, pageSize)));
      return next;
    }, { replace: true });
  }, [page, query.data?.total, setParams]);

  const activeFilters = hasActiveOrderFilters(urlFilters);
  const changeFilter = (name, value) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      const parameter = filterParamNames[name];
      const normalized = name === "search" ? value : value.trim();
      if (normalized) next.set(parameter, normalized); else next.delete(parameter);
      next.delete("page");
      return next;
    }, { replace: name === "search" });
  };
  const clearFilters = () => {
    setParams(new URLSearchParams(), { replace: true });
  };
  const setPage = (nextPage) => setParams((current) => {
    const next = new URLSearchParams(current);
    if (nextPage <= 1) next.delete("page"); else next.set("page", String(nextPage));
    return next;
  });

  return <><AdminPageHeader eyebrow="Operations" title="Orders" description="Search, inspect, and safely progress permanent Supabase orders while payment records and purchase-time snapshots remain unchanged." /><div className="mt-6"><OrderFilters filters={urlFilters} onChange={changeFilter} onClear={clearFilters} busy={query.isFetching} /></div><div className="mt-5" aria-busy={query.isFetching}>{query.isPending ? <LoadingState title="Loading orders" message="Reading the newest permanent orders from Supabase." /> : null}{query.isError ? <ErrorState title="Orders are unavailable" message={orderErrorMessage(query.error)} action={<Button variant="secondary" onClick={() => query.refetch()}>Try again</Button>} /> : null}{query.isSuccess && query.data.total === 0 && !activeFilters ? <EmptyState title="No orders yet" message="Nuede has not received any permanent orders yet." /> : null}{query.isSuccess && query.data.total === 0 && activeFilters ? <EmptyState title="No orders match" message="Orders exist outside this search or filter combination. Clear the filters to return to the complete list." action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>} /> : null}{query.isSuccess && query.data.orders.length ? <><p className="mb-3 text-sm text-muted" role="status">Newest first{query.isFetching ? " · Refreshing results…" : ""}</p><OrdersList orders={query.data.orders} returnTo={`${location.pathname}${location.search}`} /><OrdersPagination page={page} pageSize={pageSize} total={query.data.total} onPageChange={setPage} busy={query.isFetching} /></> : null}</div></>;
}
