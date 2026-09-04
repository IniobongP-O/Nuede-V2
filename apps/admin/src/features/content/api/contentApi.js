import { testimonialSchema } from "@nuede/validation/content";
import { supabase } from "../../../lib/supabaseClient.js";

export const contentPageSize = 20;
const testimonialFields = "id,customer_name,message,rating,is_published,source_feedback_id,created_at,updated_at";
const feedbackFields = "id,customer_name,email,subject,rating,message,created_at,testimonials(id,is_published)";
function client() {
  if (!supabase) throw new Error("Content management is not configured.");
  return supabase;
}
function result({ data, error, count }) {
  if (error) throw new Error("The request failed. Please retry or check your admin access.");
  return { rows: data || [], count: count || 0 };
}
// Bound and escape user search text before it enters PostgREST filter grammar.
export function searchPattern(search) {
  return `%${search.trim().slice(0, 120).replace(/[%,()."\\_*]/g, " ")}%`;
}
export async function listContent({ kind, search = "", subject = "", rating = "", publication = "", page = 0 }) {
  if (!["feedback", "testimonials"].includes(kind)) throw new Error("Invalid content collection.");
  let query = client().from(kind).select(kind === "feedback" ? feedbackFields : testimonialFields, { count: "exact" });
  if (search.trim()) {
    const pattern = searchPattern(search);
    query = query.or(`customer_name.ilike.${pattern},message.ilike.${pattern}${kind === "feedback" ? `,email.ilike.${pattern}` : ""}`);
  }
  if (kind === "feedback" && subject) query = query.eq("subject", subject);
  if (rating) query = query.eq("rating", Number(rating));
  if (kind === "testimonials" && publication) query = query.eq("is_published", publication === "published");
  return result(await query.order("created_at", { ascending: false }).order("id").range(page * contentPageSize, (page + 1) * contentPageSize - 1));
}
export async function saveTestimonial({ id, values, sourceFeedbackId }) {
  const record = testimonialSchema.parse(values);
  const query = id ? client().from("testimonials").update(record).eq("id", id)
    : client().from("testimonials").insert({ ...record, source_feedback_id: sourceFeedbackId || null, is_published: false });
  const { data, error } = await query.select(testimonialFields).single();
  if (error) throw new Error("The testimonial could not be saved. Please try again.");
  return data;
}
export async function setTestimonialPublication({ id, published }) {
  const { data, error } = await client().from("testimonials").update({ is_published: published }).eq("id", id).select(testimonialFields).single();
  if (error) throw new Error("Publication could not be changed. Please try again.");
  return data;
}
export async function deleteTestimonial(id) {
  const { data, error } = await client().from("testimonials").delete().eq("id", id).select("id").single();
  if (error) throw new Error("The testimonial could not be deleted. Please try again.");
  return data;
}
