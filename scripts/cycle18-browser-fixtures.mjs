// Synthetic public catalog and Auth identities shared by local browser suites.
// Never seed a hosted database or use these identities outside mocked HTTP.
const id = (n) => `18000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const category = { id: id(1), name: "QA kitchen", slug: "qa-kitchen", is_enabled: true, sort_order: 1 };
const nutrition = { calories: 500, protein_g: 30, carbohydrates_g: 45, fat_g: 12 };
const meal = { ...nutrition, id: id(2), name: "QA standard meal", slug: "qa-standard", category_id: category.id, category, product_type: "standard", description: "Browser fixture meal", price_kobo: 800000, image_path: null, status: "available", sort_order: 1, product_variants: [], product_addon_assignments: [] };
const addons = [3, 4].map((n) => ({ ...nutrition, id: id(n), name: `QA extra ${n}`, price_kobo: 100000, is_available: true }));
const variant = { ...nutrition, id: id(6), product_id: id(5), name: "QA rice option", description: "Selected rice description", price_kobo: 900000, status: "available", sort_order: 1 };
const grouped = { ...meal, id: id(5), name: "QA grouped bowl", slug: "qa-bowl", product_type: "grouped", price_kobo: null, requires_variant_selection: true, product_variants: [variant], product_addon_assignments: addons.map((addon) => ({ addon_id: addon.id, addon, sort_order: 1 })) };
const products = [meal, grouped, { ...meal, id: id(7), name: "QA sold out", status: "sold_out" }];
const zone = { id: id(8), name: "QA central", fee_kobo: 200000, is_active: true, sort_order: 1 };
const settings = { paystack_enabled: true, whatsapp_enabled: true };
const user = { id: id(99), email: "qa-admin@example.com", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const token = `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.qa`;

export { id, category, meal, addons, variant, grouped, products, zone, settings, user, token };
