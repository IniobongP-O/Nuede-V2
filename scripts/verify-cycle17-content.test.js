import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { feedbackSchema, feedbackSubjects, feedbackToTestimonialDraft, ratingSchema, testimonialSchema } from "../packages/validation/src/content.js";
import { faqs, getContactContent, nutritionDisclaimer } from "../apps/storefront/src/features/content/config/storefrontContent.js";
import { buildProductConfiguration } from "../apps/storefront/src/features/product-detail/utils/customizationModel.js";
import { normalizeMenuProduct } from "../apps/storefront/src/features/menu/utils/menuModel.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const valid = { customer_name: " Customer ", email: "customer@example.com", subject: "compliment", rating: "5", message: " A useful message " };

test("Cycle 17 accepts six subjects, trims text and emits only the five customer fields", () => {
  assert.equal(feedbackSubjects.length, 6);
  for (const subject of feedbackSubjects) {
    const result = feedbackSchema.parse({ ...valid, subject: subject.value, id: "forged", is_published: true, created_at: "forged" });
    assert.deepEqual(Object.keys(result).sort(), ["customer_name", "email", "message", "rating", "subject"]);
    assert.equal(result.customer_name, "Customer");
    assert.equal(result.rating, 5);
  }
});
test("Cycle 17 rejects invalid feedback, blank text, unsupported subjects and unreasonable sizes", () => {
  for (const [key, values] of Object.entries({ customer_name: ["", "  \n", "x".repeat(121)], email: ["", "a", "a@b", "a b@c.com", "a@b..com", "x".repeat(255)], message: ["", "\n\t", "x".repeat(5001)], subject: ["", "General inquiry", "unsupported"] })) {
    for (const value of values) assert.equal(feedbackSchema.safeParse({ ...valid, [key]: value }).success, false, `${key}: ${String(value).slice(0, 40)}`);
  }
  assert.equal(feedbackSchema.safeParse({ ...valid, customer_name: "x".repeat(120), message: "x".repeat(5000) }).success, true);
});
test("Cycle 17 has one integer 1–5 rating scale without boolean/null coercion", () => {
  for (const value of [0, 6, -1, 2.5, NaN, Infinity, null, undefined, true, false, "", " ", "bad"]) assert.equal(ratingSchema.safeParse(value).success, false);
  for (const value of [1, 2, 3, 4, 5, "1", "5"]) assert.equal(ratingSchema.parse(value), Number(value));
});
test("Cycle 17 conversion copies only editable public values and preserves the source", () => {
  const original = Object.freeze({ ...valid, id: "feedback-id", admin_notes: "private", created_at: "private" });
  const draft = feedbackToTestimonialDraft(original);
  assert.deepEqual(Object.keys(draft).sort(), ["customer_name", "message", "rating"]);
  draft.customer_name = "Redacted";
  assert.equal(original.customer_name, valid.customer_name);
  assert.equal("email" in draft, false);
  assert.equal("is_published" in draft, false);
  assert.deepEqual(Object.keys(testimonialSchema.parse({ ...draft, email: valid.email, is_published: true })).sort(), ["customer_name", "message", "rating"]);
});
test("Cycle 17 optional contacts fail gracefully and never create unsafe links", () => {
  assert.deepEqual(getContactContent().links, []);
  assert.equal(getContactContent({ VITE_CONTACT_INSTAGRAM: "javascript:alert(1)", VITE_CONTACT_PHONE: "fake", VITE_CONTACT_WHATSAPP: "fake", VITE_CONTACT_EMAIL: "fake" }).links.length, 0);
  for (const url of ["https://evil.example/nuede", "http://instagram.com/nuede", "https://instagram.com.evil.example/nuede", "https://name:pass@instagram.com/nuede"]) assert.equal(getContactContent({ VITE_CONTACT_INSTAGRAM: url }).links.length, 0);
  const contacts = getContactContent({ VITE_CONTACT_INSTAGRAM: "https://www.instagram.com/test_account/", VITE_CONTACT_PHONE: "+234 800 000 0000", VITE_CONTACT_WHATSAPP: "+2348000000000", VITE_CONTACT_EMAIL: "test@example.com", VITE_CONTACT_HOURS: "Configured hours" });
  assert.equal(contacts.links.length, 4);
  assert.ok(contacts.links.some((link) => link.href === "https://wa.me/2348000000000"));
  assert.equal(contacts.hours, "Configured hours");
});
test("Cycle 17 content covers documented FAQ subjects and nutrition variation", () => {
  assert.equal(faqs.length, 7);
  for (const word of ["ingredient substitutions", "preparation", "portion"]) assert.ok(nutritionDisclaimer.includes(word));
});
test("Cycle 17 featured quick-add reuses availability and variant validation", () => {
  const row = { id: "20000000-0000-4000-8000-000000000001", name: "Test", product_type: "standard", price_kobo: 100, status: "available", product_variants: [] };
  assert.equal(buildProductConfiguration({ product: normalizeMenuProduct(row), quantity: 1 }).valid, true);
  for (const status of ["sold_out", "unavailable", "price_pending", "hidden"]) assert.equal(buildProductConfiguration({ product: normalizeMenuProduct({ ...row, status }), quantity: 1 }).valid, false);
  assert.equal(buildProductConfiguration({ product: normalizeMenuProduct({ ...row, product_type: "grouped", requires_variant_selection: true }), quantity: 1 }).valid, false);
});
test("Cycle 17 public data access is a narrow projection and write-only feedback submission", async () => {
  const api = await read("apps/storefront/src/features/content/api/contentApi.js");
  assert.match(api, /from\("published_testimonials"\)/);
  assert.match(api, /select\("id,customer_name,message,rating"\)/);
  const submission = api.slice(api.indexOf("export async function submitFeedback"));
  assert.match(submission, /feedbackSchema.parse/);
  assert.match(submission, /from\("feedback"\).insert\(record\)/);
  assert.doesNotMatch(submission, /\.select\(/);
});
test("Cycle 17 SQL contract protects metadata, publication, private inserts and audit", async () => {
  const sql = await read("supabase/migrations/20260904000100_complete_feedback_and_testimonials.sql");
  assert.match(sql, /grant insert \(customer_name, email, subject, rating, message\).*to anon/);
  assert.match(sql, /drop policy testimonials_public_select/);
  assert.match(sql, /select id, customer_name, message, rating\s+from public.testimonials where is_published = true/);
  assert.match(sql, /if tg_op = 'INSERT' then\s+if new.is_published then\s+raise exception/);
  assert.match(sql, /feedback_converted_to_testimonial/);
  assert.match(sql, /insert into public.admin_audit_log/);
  assert.doesNotMatch(sql, /disable row level security|delete from public.feedback|create table/);
});
test("Cycle 17 migration does not recreate existing indexes", async () => {
  const name = "20260904000100_complete_feedback_and_testimonials.sql";
  const sql = await read(`supabase/migrations/${name}`);
  const earlier = (await readdir(new URL("../supabase/migrations", import.meta.url))).filter((file) => file.endsWith(".sql") && file < name);
  const previous = (await Promise.all(earlier.map((file) => read(`supabase/migrations/${file}`)))).join("\n");
  for (const [, index] of sql.matchAll(/create (?:unique )?index (\w+)/g)) assert.doesNotMatch(previous, new RegExp(`create (?:unique )?index ${index}\\b`), `${index} already exists`);
});
test("Cycle 17 admin querying composes server filters and bounds private data", async () => {
  const api = await read("apps/admin/src/features/content/api/contentApi.js");
  assert.match(api, /contentPageSize = 20/);
  assert.match(api, /query.eq\("subject", subject\)/);
  assert.match(api, /query.eq\("rating", Number\(rating\)\)/);
  assert.match(api, /\.range\(page \* contentPageSize/);
  assert.match(api, /source_feedback_id: sourceFeedbackId \|\| null, is_published: false/);
  assert.doesNotMatch(api, /from\("feedback"\).(?:update|delete)/);
});
test("Cycle 17 content has no fixtures or unsafe HTML and refetches publication", async () => {
  for (const file of ["apps/storefront/src/pages/HomePage.jsx", "apps/storefront/src/components/layout/StorefrontFooter.jsx", "apps/admin/src/pages/TestimonialsPage.jsx", "apps/admin/src/pages/FeedbackPage.jsx"]) {
    const source = await read(file);
    assert.doesNotMatch(source, /fixtures|dangerouslySetInnerHTML|##INLINE##|Webflow/);
  }
  const hooks = await read("apps/storefront/src/features/content/hooks/useContent.js");
  assert.match(hooks, /refetchInterval: 30_000/);
  assert.match(hooks, /refetchOnWindowFocus: "always"/);
  const featured = await read("apps/storefront/src/features/content/components/FeaturedMeals.jsx");
  assert.match(featured, /buildProductConfiguration/);
  assert.match(featured, /ProductDetailDialog/);
  assert.doesNotMatch(featured, /supabase|from\("products"\)/);
});
