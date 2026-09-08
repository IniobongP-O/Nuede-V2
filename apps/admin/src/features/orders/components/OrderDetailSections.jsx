import { CalendarDays, CreditCard, MapPin, PackageOpen, UserRound } from "lucide-react";

import { formatKobo } from "@nuede/domain/currency";
import { Panel } from "../../../components/ui/AdminPrimitives.jsx";
import { OrderStatusBadge } from "./OrderStatusBadge.jsx";
import { formatNutritionValue, formatOrderDate, orderValueLabel } from "../utils/orderUtils.js";

/** Renders a consistent icon-labelled heading for an order detail section. */
function SectionTitle({ icon: Icon, children }) {
  return <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-950"><Icon className="size-5 text-brand-700" aria-hidden="true" />{children}</h2>;
}

/** Renders labelled order facts as an accessible definition list. */
function DefinitionList({ entries }) {
  return <dl className="mt-4 grid gap-4 sm:grid-cols-2">{entries.map(([label, value]) => <div key={label}><dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-brand-950">{value ?? "Not recorded"}</dd></div>)}</dl>;
}

/** Extracts and formats nutrition fields from an order or item snapshot. */
function NutritionSummary({ record, prefix = "" }) {
  const completeness = record[`${prefix}nutrition_completeness`];
  return <div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><div><p className="text-xs text-muted">Calories</p><p className="font-semibold">{formatNutritionValue(record[`${prefix}total_calories`] ?? record.calories, " kcal")}</p></div><div><p className="text-xs text-muted">Protein</p><p className="font-semibold">{formatNutritionValue(record[`${prefix}total_protein_g`] ?? record.protein_g, "g")}</p></div><div><p className="text-xs text-muted">Carbohydrates</p><p className="font-semibold">{formatNutritionValue(record[`${prefix}total_carbohydrates_g`] ?? record.carbohydrates_g, "g")}</p></div><div><p className="text-xs text-muted">Fat</p><p className="font-semibold">{formatNutritionValue(record[`${prefix}total_fat_g`] ?? record.fat_g, "g")}</p></div></div>{completeness && completeness !== "complete" ? <p className="mt-3 text-sm text-warning" role="note">{completeness === "partial" ? "Historical nutrition is incomplete; totals include only stored known values." : "Nutrition was unavailable when this order was purchased."}</p> : null}</div>;
}

/** Renders immutable order identity, type, and status information. */
export function OrderIdentityCard({ order }) {
  return <Panel className="p-5"><SectionTitle icon={CalendarDays}>Order identity</SectionTitle><DefinitionList entries={[["Nuede reference", order.order_reference], ["Internal ID", order.id], ["Order type", orderValueLabel(order.order_type)], ["Created", formatOrderDate(order.created_at)], ["Last updated", formatOrderDate(order.updated_at)]]} /></Panel>;
}

/** Renders the customer's snapshotted contact details. */
export function OrderCustomerCard({ order }) {
  return <Panel className="p-5"><SectionTitle icon={UserRound}>Customer</SectionTitle><DefinitionList entries={[["Full name", order.customer_name], ["Phone", order.customer_phone], ["Email", order.customer_email]]} /></Panel>;
}

/** Renders snapshotted address, zone, and fulfilment details. */
export function OrderDeliveryCard({ order }) {
  return <Panel className="p-5"><SectionTitle icon={MapPin}>Delivery</SectionTitle><DefinitionList entries={[["Delivery area snapshot", order.delivery_zone_name], ["Delivery fee", formatKobo(order.delivery_fee_kobo)], ["Complete address", order.delivery_address], ["Landmark", order.delivery_landmark]]} /></Panel>;
}

/** Renders authoritative subtotal, delivery fee, total, and order nutrition. */
export function OrderTotalsCard({ order }) {
  return <Panel className="p-5"><SectionTitle icon={PackageOpen}>Purchased totals</SectionTitle><DefinitionList entries={[["Subtotal", formatKobo(order.subtotal_kobo)], ["Delivery", formatKobo(order.delivery_fee_kobo)], ["Authoritative total", formatKobo(order.total_kobo)], ["Nutrition quality", orderValueLabel(order.nutrition_completeness)]]} /><div className="mt-5 border-t border-line pt-5"><NutritionSummary record={order} /></div><p className="mt-4 text-xs leading-5 text-muted">All values are purchase-time snapshots. Current menu prices and nutrition are not used.</p></Panel>;
}

/** Renders every purchased item, variant, add-on, price, and nutrition snapshot. */
export function OrderItemsCard({ items }) {
  return <Panel className="p-5"><SectionTitle icon={PackageOpen}>Purchased items</SectionTitle><ul className="mt-4 divide-y divide-line">{items.map((item) => <li key={item.id} className="py-5 first:pt-0 last:pb-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-brand-950">{item.product_name}</h3>{item.variant_name ? <p className="mt-1 text-sm text-muted">Variant: {item.variant_name}</p> : null}<p className="mt-1 text-sm text-muted">Quantity {item.quantity} · base {formatKobo(item.unit_base_price_kobo)} each</p>{item.scheduled_for ? <p className="mt-1 text-sm text-brand-700">{formatOrderDate(`${item.scheduled_for}T12:00:00`, { dateOnly: true })} · {orderValueLabel(item.meal_slot)}</p> : null}</div><p className="font-semibold">{formatKobo(item.line_total_kobo)}</p></div>{item.order_item_addons?.length ? <div className="mt-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Selected add-ons</p><ul className="mt-2 grid gap-2 sm:grid-cols-2">{item.order_item_addons.map((addon) => <li key={addon.id} className="rounded-control bg-canvas px-3 py-2 text-sm"><div className="flex justify-between gap-3"><span>{addon.addon_name}</span><span className="font-semibold">{formatKobo(addon.unit_price_kobo)}</span></div><p className="mt-1 text-xs text-muted">{formatNutritionValue(addon.calories, " kcal")} · P {formatNutritionValue(addon.protein_g, "g")} · C {formatNutritionValue(addon.carbohydrates_g, "g")} · F {formatNutritionValue(addon.fat_g, "g")}</p></li>)}</ul></div> : <p className="mt-3 text-sm text-muted">No add-ons selected.</p>}<div className="mt-4 rounded-control bg-canvas p-3"><NutritionSummary record={item} /></div></li>)}</ul></Panel>;
}

/** Reconstructs and renders a meal-plan schedule from item coordinates. */
export function MealPlanScheduleCard({ order }) {
  if (order.order_type !== "meal_plan") return null;
  const days = order.order_items.reduce((grouped, item) => {
    const date = item.scheduled_for || "Unscheduled";
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(item);
    return grouped;
  }, {});
  const duration = order.meal_plan_start_date && order.meal_plan_end_date
    ? Math.round((new Date(`${order.meal_plan_end_date}T12:00:00`) - new Date(`${order.meal_plan_start_date}T12:00:00`)) / 86_400_000) + 1
    : null;
  return <Panel className="p-5"><SectionTitle icon={CalendarDays}>Meal-plan schedule</SectionTitle><p className="mt-2 text-sm text-muted">{duration ? `${duration} days · ` : ""}{formatOrderDate(`${order.meal_plan_start_date}T12:00:00`, { dateOnly: true })} to {formatOrderDate(`${order.meal_plan_end_date}T12:00:00`, { dateOnly: true })}</p><div className="mt-4 grid gap-4">{Object.entries(days).map(([date, items]) => <section key={date} className="rounded-control border border-line p-4"><h3 className="font-semibold text-brand-950">{date === "Unscheduled" ? date : formatOrderDate(`${date}T12:00:00`, { dateOnly: true })}</h3><ul className="mt-3 grid gap-2">{items.map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-2 text-sm"><span><strong>{orderValueLabel(item.meal_slot)}</strong> · {item.product_name}{item.variant_name ? ` — ${item.variant_name}` : ""}{item.order_item_addons?.length ? ` · ${item.order_item_addons.map((addon) => addon.addon_name).join(", ")}` : ""}</span><span>Qty {item.quantity}</span></li>)}</ul></section>)}</div><p className="mt-4 text-xs text-muted">Schedule is read from the permanent order snapshot, never browser storage.</p></Panel>;
}

/** Renders payment method, status, and provider references for support use. */
export function OrderPaymentCard({ order }) {
  return <Panel className="p-5"><SectionTitle icon={CreditCard}>Payment</SectionTitle><div className="mt-4 flex flex-wrap gap-2"><OrderStatusBadge type="payment" value={order.payment_status} /><span className="text-sm font-semibold text-brand-950">{orderValueLabel(order.payment_method)}</span></div>{order.payments.length ? <ul className="mt-4 grid gap-4">{order.payments.map((payment) => <li key={payment.id} className="rounded-control border border-line p-4"><DefinitionList entries={[["Payment record", payment.id], ["Provider", orderValueLabel(payment.provider || payment.payment_method)], ["Provider reference", payment.provider_reference], ["Expected amount", formatKobo(payment.amount_kobo)], ["Verified paid amount", payment.provider_amount_kobo == null ? null : formatKobo(payment.provider_amount_kobo)], ["Payment record status", orderValueLabel(payment.status)], ["Verification", orderValueLabel(payment.verification_status)], ["Provider status", payment.provider_status], ["Initialized", formatOrderDate(payment.created_at)], ["Verified", formatOrderDate(payment.verified_at)], ["Last provider event", formatOrderDate(payment.last_event_at)]]} /></li>)}</ul> : <p className="mt-4 text-sm text-muted">No separate payment attempt is stored for this {orderValueLabel(order.payment_method)} order. Its order-level payment state remains {orderValueLabel(order.payment_status)}.</p>}<p className="mt-4 text-xs leading-5 text-muted">Paystack state and provider references remain read-only. Authorized admins can confirm eligible WhatsApp payments separately; fulfilment actions never change payment state.</p></Panel>;
}
