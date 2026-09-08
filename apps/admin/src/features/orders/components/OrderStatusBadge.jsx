import { StatusBadge } from "../../../components/ui/AdminPrimitives.jsx";
import { orderStatusTone, orderValueLabel } from "../utils/orderUtils.js";

/** Renders a payment or fulfilment status with its domain-specific tone and label. */
export function OrderStatusBadge({ type, value }) {
  return <StatusBadge tone={orderStatusTone(type, value)}><span className="sr-only">{type === "payment" ? "Payment" : "Fulfilment"}: </span>{orderValueLabel(value)}</StatusBadge>;
}
