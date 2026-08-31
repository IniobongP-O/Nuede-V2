export const demoMetrics = Object.freeze([
  { label: "Revenue · 30 days", value: "₦1.84m", detail: "Fixture only", trend: "↑ demo" },
  { label: "Paid orders", value: "218", detail: "7 awaiting fulfilment", trend: null },
  { label: "Average order", value: "₦8,440", detail: "Static example", trend: null },
  { label: "Items sold", value: "384", detail: "Demo count", trend: null },
]);

export const demoOrders = Object.freeze([
  { id: "#ND-DEMO-1048", customer: "Demo customer A", total: "₦18,500", payment: "Paid", method: "Paystack", status: "Preparing", tone: "warning" },
  { id: "#ND-DEMO-1047", customer: "Demo customer B", total: "₦9,000", payment: "Paid", method: "Paystack", status: "Ready", tone: "success" },
  { id: "#ND-DEMO-1046", customer: "Demo customer C", total: "₦24,500", payment: "Unpaid", method: "WhatsApp", status: "New", tone: "neutral" },
  { id: "#ND-DEMO-1045", customer: "Demo customer D", total: "₦7,500", payment: "Paid", method: "Paystack", status: "Delivered", tone: "success" },
]);

export const demoAdminMeals = Object.freeze([
  { name: "Herb Salmon Plate", category: "Main meal", price: "₦9,500", status: "Available", tone: "success" },
  { name: "Peppered Chicken Bowl", category: "Grouped meal", price: "From ₦8,000", status: "Available", tone: "success" },
  { name: "Creamy Garden Pasta", category: "Main meal", price: "₦8,500", status: "Price pending", tone: "warning" },
  { name: "Green Protein Plate", category: "Main meal", price: "₦7,500", status: "Sold out", tone: "danger" },
]);

export const demoDeliveryAreas = Object.freeze([
  { area: "Wuse 2", fee: "₦2,000", status: "Active", tone: "success" },
  { area: "Gwarimpa", fee: "₦2,500", status: "Active", tone: "success" },
  { area: "Other", fee: "Set later", status: "Inactive", tone: "neutral" },
]);

export const demoTestimonials = Object.freeze([
  { name: "Demo reviewer A", rating: "5 / 5", excerpt: "A fixture testimonial used to demonstrate the list/editor layout.", status: "Published", tone: "success" },
  { name: "Demo reviewer B", rating: "4 / 5", excerpt: "No customer record or testimonial is stored in Cycle 1.", status: "Draft", tone: "neutral" },
]);

export const demoFeedback = Object.freeze([
  { id: "FB-DEMO-01", name: "Demo sender", subject: "Delivery feedback", rating: "5 / 5", status: "Unread" },
  { id: "FB-DEMO-02", name: "Demo sender", subject: "Menu suggestion", rating: "4 / 5", status: "Reviewed" },
  { id: "FB-DEMO-03", name: "Demo sender", subject: "General inquiry", rating: "—", status: "Reviewed" },
]);

export const demoChartPoints = Object.freeze([42, 58, 51, 72, 68, 84, 77, 92, 88, 100]);
