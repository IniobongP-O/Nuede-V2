import { Star } from "lucide-react";
import { Button } from "../../../components/ui/Button.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/FeedbackStates.jsx";
import { useTestimonials } from "../hooks/useContent.js";
import { ScrollCarousel } from "./ScrollCarousel.jsx";

export function Testimonials() {
  const query = useTestimonials();
  if (query.isPending) return <LoadingState title="Loading testimonials" message="Getting the latest published customer stories." />;
  if (query.isError) return <ErrorState title="Testimonials are unavailable" message="Please try again in a moment." action={<Button onClick={() => query.refetch()}>Try again</Button>} />;
  if (!query.data.length) return <EmptyState title="Customer stories are on their way" message="Have something to share? Send us your feedback below." />;
  return <ScrollCarousel label="testimonials">{query.data.map((item) => <figure key={item.id} className="m-0 w-[85%] shrink-0 snap-start rounded-card border border-line bg-surface p-6 sm:w-[48%] lg:w-[32%]">
    <div className="flex items-center gap-2 text-brand-700"><Star className="size-5" aria-hidden="true" /><span className="text-sm font-semibold">{item.rating} out of 5</span></div>
    <blockquote className="mt-5 whitespace-pre-wrap break-words text-base leading-7 text-brand-950">{item.message}</blockquote><figcaption className="mt-6 break-words text-sm font-semibold text-muted">{item.customer_name}</figcaption>
  </figure>)}</ScrollCarousel>;
}
