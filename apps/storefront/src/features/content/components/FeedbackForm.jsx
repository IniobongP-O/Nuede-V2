import { zodResolver } from "@hookform/resolvers/zod";
import { feedbackSchema, feedbackSubjects } from "@nuede/validation/content";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button.jsx";
import { SelectInput, TextArea, TextInput } from "../../../components/ui/FormControls.jsx";
import { useFeedbackSubmission } from "../hooks/useContent.js";

/** Owns validation, submission, and success/error feedback for customer messages. */
export function FeedbackForm() {
  const mutation = useFeedbackSubmission();
  const inFlight = useRef(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(feedbackSchema), defaultValues: { customer_name: "", email: "", subject: "", rating: "", message: "" },
  });
  const submit = (event) => handleSubmit(async (values) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await mutation.mutateAsync(values);
      reset();
      setSent(true);
    } catch {
      setError("root", { message: "We couldn't send your feedback. Your entries are still here. Check your connection and try again." });
    } finally { inFlight.current = false; }
  })(event);
  return <section id="feedback" className="scroll-mt-24" aria-labelledby="feedback-heading">
    <h2 id="feedback-heading" className="font-display text-3xl text-brand-950">Tell us how we did.</h2>
    <p className="mt-3 text-sm leading-6 text-muted">Questions, suggestions or something we could do better? Send a private message to the Nuede team. No account needed. Submitting feedback does not publish a review.</p>
    {sent ? <div className="mt-6 rounded-card border border-line p-5"><p role="status" className="font-semibold text-brand-950">Thank you. Your feedback has been sent to our team.</p><Button className="mt-4" variant="secondary" onClick={() => { setSent(false); mutation.reset(); }}>Send another message</Button></div> :
      <form onSubmit={submit} noValidate className="mt-6 grid gap-5">
        <fieldset disabled={isSubmitting || mutation.isPending} className="grid min-w-0 gap-5">
          <legend className="sr-only">Private customer feedback</legend>
          <div className="grid gap-5 sm:grid-cols-2"><TextInput label="Name" required autoComplete="name" maxLength={120} error={errors.customer_name?.message} {...register("customer_name")} /><TextInput label="Email" type="email" required autoComplete="email" maxLength={254} error={errors.email?.message} {...register("email")} /></div>
          <div className="grid gap-5 sm:grid-cols-2"><SelectInput label="Subject" required error={errors.subject?.message} {...register("subject")}><option value="">Choose a subject</option>{feedbackSubjects.map((subject) => <option key={subject.value} value={subject.value}>{subject.label}</option>)}</SelectInput><SelectInput label="Rating" required error={errors.rating?.message} {...register("rating")}><option value="">Choose a rating</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} out of 5</option>)}</SelectInput></div>
          <TextArea label="Written feedback" required maxLength={5000} help="Up to 5,000 characters. Please do not include payment card details." error={errors.message?.message} {...register("message")} />
        </fieldset>
        {errors.root ? <p role="alert" className="text-sm text-danger">{errors.root.message}</p> : null}
        <Button type="submit" className="justify-self-start" busy={isSubmitting || mutation.isPending}>Send feedback</Button>
      </form>}
  </section>;
}
