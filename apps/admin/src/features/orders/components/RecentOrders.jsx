import { Button } from "../../../components/ui/Button.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/FeedbackStates.jsx";
import { useOrders } from "../hooks/useOrders.js";
import { OrdersList } from "./OrdersList.jsx";

const recentFilters = Object.freeze({ page: 1, pageSize: 5 });

/** Loads and renders the most recent orders for the admin dashboard. */
export function RecentOrders() {
  const query = useOrders(recentFilters);
  return <section className="mt-6 min-w-0" aria-labelledby="recent-orders-heading">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 id="recent-orders-heading" className="text-xl font-semibold text-brand-950">Recent orders</h2><Button to="/orders" variant="secondary">View all orders</Button></div>
    {query.isPending ? <LoadingState title="Loading recent orders" message="Reading the latest orders." /> : query.isError ? <ErrorState title="Recent orders are unavailable" message="Please try again." action={<Button onClick={() => query.refetch()}>Retry orders</Button>} /> : query.data.orders.length ? <OrdersList orders={query.data.orders} returnTo="/dashboard" /> : <EmptyState title="No orders yet" message="New orders will appear here." />}
  </section>;
}
