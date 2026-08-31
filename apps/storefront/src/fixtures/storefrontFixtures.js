export const demoMeals = Object.freeze([
  { id: "demo-herb-plate", name: "Herb Salmon Plate", category: "High protein", description: "Herbed fillet with seasonal vegetables and a balanced side.", price: "₦9,500", nutrition: "610 kcal · 44g protein", tone: "from-emerald-100 via-lime-50 to-amber-100", available: true, isFixture: true },
  { id: "demo-peppered-bowl", name: "Peppered Chicken Bowl", category: "Chef's pick", description: "Roasted vegetables, grains, and a warmly seasoned protein.", price: "₦10,500", nutrition: "720 kcal · 46g protein", tone: "from-orange-100 via-red-50 to-emerald-100", available: true, isFixture: true },
  { id: "demo-garden-pasta", name: "Creamy Garden Pasta", category: "Comfort", description: "Pasta, greens, herbs, and a silky demo sauce.", price: "₦8,500", nutrition: "690 kcal · 31g protein", tone: "from-amber-100 via-stone-50 to-green-100", available: true, isFixture: true },
  { id: "demo-protein-plate", name: "Green Protein Plate", category: "Light & fresh", description: "Crisp greens, roasted vegetables, and a bright dressing.", price: "₦7,500", nutrition: "520 kcal · 36g protein", tone: "from-green-100 via-yellow-50 to-rose-100", available: false, isFixture: true },
  { id: "demo-tuna-salad", name: "Tuna Crunch Salad", category: "Lean", description: "Greens, grains, vegetables, and a fresh herb dressing.", price: "₦7,000", nutrition: "470 kcal · 38g protein", tone: "from-cyan-100 via-green-50 to-amber-100", available: true, isFixture: true },
  { id: "demo-noodle-bowl", name: "Sesame Noodle Bowl", category: "Chef's pick", description: "Saucy noodles, vegetables, and a simple protein choice.", price: "₦8,000", nutrition: "650 kcal · 34g protein", tone: "from-yellow-100 via-red-50 to-green-100", available: true, isFixture: true },
]);

export const demoFaqs = Object.freeze([
  { question: "When should I place my order?", answer: "This fixture previews the future ordering-information pattern. Production timing arrives with storefront content in Cycle 17." },
  { question: "Can I customize grouped meals?", answer: "The eventual product experience supports variants and eligible add-ons. Customization is assigned to Cycle 7." },
  { question: "How will payment work?", answer: "The specification supports enabled Paystack and WhatsApp routes. No payment integration exists in Cycle 1." },
]);

export const demoPlanDays = Object.freeze([
  { day: "Monday", date: "Demo day 1", meals: ["Breakfast slot", "Peppered Chicken Bowl", "Dinner slot", "Snack slot"] },
  { day: "Tuesday", date: "Demo day 2", meals: ["Protein oats", "Lunch slot", "Creamy Garden Pasta", "Snack slot"] },
  { day: "Wednesday", date: "Demo day 3", meals: ["Breakfast slot", "Green Protein Plate", "Dinner slot", "Snack slot"] },
]);

export const demoOrderItems = Object.freeze([
  { name: "Peppered Chicken Bowl", detail: "Demo configuration · Qty 1", price: "₦10,500" },
  { name: "Green Protein Plate", detail: "Demo configuration · Qty 1", price: "₦7,500" },
]);

export const demoPaymentStates = Object.freeze([
  { id: "confirming", label: "Confirming", tone: "neutral", title: "Confirming payment", message: "The real experience will wait for trusted backend verification." },
  { id: "successful", label: "Successful", tone: "success", title: "Payment successful", message: "A verified order reference and next steps will appear here." },
  { id: "pending", label: "Pending", tone: "warning", title: "Payment still pending", message: "Customers will receive clear guidance without assuming a redirect proves payment." },
  { id: "failed", label: "Failed", tone: "danger", title: "Payment could not be confirmed", message: "The final flow will offer safe recovery without creating duplicate orders." },
]);
