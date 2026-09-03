// Kept as an empty legacy fixture export for the Cycle 1 ownership contract.
// Live dashboard and analytics surfaces must never consume fixture metrics.
export const demoMetrics = Object.freeze([]);

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
