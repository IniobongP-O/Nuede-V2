import { useMutation, useQuery } from "@tanstack/react-query";
import { getPublishedTestimonials, submitFeedback } from "../api/contentApi.js";

export function useTestimonials() {
  return useQuery({ queryKey: ["published-testimonials"], queryFn: getPublishedTestimonials,
    staleTime: 0, refetchOnWindowFocus: "always", refetchInterval: 30_000, refetchIntervalInBackground: false });
}

export function useFeedbackSubmission() {
  return useMutation({ mutationFn: submitFeedback, retry: false });
}
