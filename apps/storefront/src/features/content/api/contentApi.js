import { feedbackSchema, testimonialSchema } from "@nuede/validation/content";
import { supabase } from "../../../lib/supabaseClient.js";

/** Loads the bounded, public testimonial projection used on the storefront. */
/** Loads and validates the bounded public testimonial list. */
export async function getPublishedTestimonials() {
  if (!supabase) throw new Error("Testimonials are temporarily unavailable.");
  const { data, error } = await supabase.from("published_testimonials")
    .select("id,customer_name,message,rating").order("id").limit(50);
  if (error) throw new Error("Testimonials are temporarily unavailable.");
  return (data || []).map((row) => ({ id: row.id, ...testimonialSchema.parse(row) }));
}

/** Validates and inserts private customer feedback without requesting the new row. */
/** Validates and inserts private customer feedback without reading the new row back. */
export async function submitFeedback(values) {
  const record = feedbackSchema.parse(values);
  if (!supabase) throw new Error("We couldn't send your feedback. Please try again later.");
  // No returning/select: the submitter has no right to read a private feedback row.
  const { error } = await supabase.from("feedback").insert(record);
  if (error) throw new Error("We couldn't send your feedback. Please check your connection and try again.");
}
