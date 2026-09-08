import { useMutation, useQuery } from "@tanstack/react-query";
import { getPublishedTestimonials, submitFeedback } from "../api/contentApi.js";

/** Provides the public, cached testimonial query. */
export function useTestimonials() {
  return useQuery({ queryKey: ["published-testimonials"], queryFn: getPublishedTestimonials,
    staleTime: 0, refetchOnWindowFocus: "always", refetchInterval: 30_000, refetchIntervalInBackground: false });
}

/** Provides the customer feedback submission mutation. */
export function useFeedbackSubmission() {
  return useMutation({ mutationFn: submitFeedback, retry: false });
}
