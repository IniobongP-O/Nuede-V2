import { StatusBadge } from "../../../components/ui/AdminPrimitives.jsx";
import { orderStatusTone, orderValueLabel } from "../utils/orderUtils.js";

export function OrderStatusBadge({ type, value }) {
  return <StatusBadge tone={orderStatusTone(type, value)}><span className="sr-only">{type === "payment" ? "Payment" : "Fulfilment"}: </span>{orderValueLabel(value)}</StatusBadge>;
}
