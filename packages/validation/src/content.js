import { z } from "zod";

export const feedbackSubjects = Object.freeze([
  { value: "general_inquiry", label: "General inquiry" },
  { value: "order_issue", label: "Order issue" },
  { value: "menu_suggestion", label: "Menu suggestion" },
  { value: "delivery_feedback", label: "Delivery feedback" },
  { value: "compliment", label: "Compliment" },
  { value: "other", label: "Other" },
]);

export const ratingSchema = z.union([z.number(), z.enum(["1", "2", "3", "4", "5"]).transform(Number)], { error: "Choose a rating from 1 to 5." }).pipe(z.number().int("Choose a whole rating from 1 to 5.").min(1).max(5));
const customerName = z.string().trim().min(1, "Enter a name.").max(120, "Use 120 characters or fewer.");
const message = z.string().trim().min(1, "Enter your message.").max(5000, "Use 5,000 characters or fewer.");
export const testimonialSchema = z.object({ customer_name: customerName, message, rating: ratingSchema });
export const feedbackSchema = testimonialSchema.extend({
  email: z.string().trim().max(254).regex(/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/, "Enter a valid email address."),
  subject: z.enum(feedbackSubjects.map((subject) => subject.value), { error: "Choose a feedback subject." }),
});

// An allowlist: private email, timestamps and publication state never enter the editor.
export function feedbackToTestimonialDraft(feedback) {
  return { customer_name: feedback.customer_name, message: feedback.message, rating: feedback.rating };
}

export function subjectLabel(value) {
  return feedbackSubjects.find((subject) => subject.value === value)?.label || value || "Other";
}
