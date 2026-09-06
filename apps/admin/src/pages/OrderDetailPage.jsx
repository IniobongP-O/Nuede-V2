import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackStates.jsx";
import { useToast } from "../components/ui/toastContext.js";
import { FulfilmentActions } from "../features/orders/components/FulfilmentActions.jsx";
import { DeleteOrderAction } from "../features/orders/components/DeleteOrderAction.jsx";
import { MealPlanScheduleCard, OrderCustomerCard, OrderDeliveryCard, OrderIdentityCard, OrderItemsCard, OrderPaymentCard, OrderTotalsCard } from "../features/orders/components/OrderDetailSections.jsx";
import { OrderStatusBadge } from "../features/orders/components/OrderStatusBadge.jsx";
import { useOrder, useUpdateFulfilmentStatus } from "../features/orders/hooks/useOrders.js";
import { orderErrorMessage } from "../features/orders/utils/orderUtils.js";

export function OrderDetailPage() {
  const { orderReference } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const backTo = location.state?.returnTo?.startsWith("/orders") ? location.state.returnTo : "/orders";
  const query = useOrder(orderReference);
  const mutation = useUpdateFulfilmentStatus(orderReference);
  const { notify } = useToast();

  const updateStatus = async (nextFulfilmentStatus) => {
    try {
      await mutation.mutateAsync({ orderId: query.data.id, nextFulfilmentStatus });
      notify(nextFulfilmentStatus === "cancelled" ? `${query.data.order_reference} was cancelled. Payment state was not changed.` : `${query.data.order_reference} is now ${nextFulfilmentStatus.replaceAll("_", " ")}.`);
      return true;
    } catch (error) {
      notify(orderErrorMessage(error, "The fulfilment status could not be updated. The latest order state has been loaded."), "error");
      return false;
    }
  };

  if (query.isPending) return <LoadingState title="Loading order detail" message="Reading purchase snapshots, delivery, schedule, and trusted payment records." />;
  if (query.isError) return <ErrorState title="Order detail is unavailable" message={orderErrorMessage(query.error)} action={<div className="flex flex-wrap justify-center gap-2"><Button variant="secondary" to={backTo}>Back to orders</Button><Button onClick={() => query.refetch()}>Try again</Button></div>} />;
  if (!query.data) return <EmptyState title="Order not found" message="This order could not be found or is not available to your current administrative session." action={<Button variant="secondary" to={backTo}>Back to orders</Button>} />;

  const order = query.data;
  return <><AdminPageHeader eyebrow="Order detail" title={order.order_reference} description="Purchase, customer, delivery, nutrition, and payment records." actions={<><Button variant="secondary" to={backTo}><ArrowLeft className="size-4" aria-hidden="true" />Back to orders</Button><DeleteOrderAction order={order} size="medium" onDeleted={() => navigate(backTo, { replace: true })} /></>} /><div className="mt-4 flex flex-wrap gap-2"><OrderStatusBadge type="payment" value={order.payment_status} /><OrderStatusBadge type="fulfilment" value={order.fulfilment_status} /></div><div className="mt-6"><FulfilmentActions order={order} mutation={mutation} onUpdate={updateStatus} /></div><div className="mt-5 grid gap-5 xl:grid-cols-2"><OrderIdentityCard order={order} /><OrderCustomerCard order={order} /><OrderDeliveryCard order={order} /><OrderTotalsCard order={order} /></div><div className="mt-5 grid gap-5"><MealPlanScheduleCard order={order} /><OrderItemsCard items={order.order_items} /><OrderPaymentCard order={order} /></div></>;
}
