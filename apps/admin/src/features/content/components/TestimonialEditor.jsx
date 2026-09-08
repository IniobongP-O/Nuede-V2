import { zodResolver } from "@hookform/resolvers/zod";
import { feedbackToTestimonialDraft, testimonialSchema } from "@nuede/validation/content";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button.jsx";
import { Dialog } from "../../../components/ui/Dialog.jsx";
import { SelectInput, TextArea, TextInput } from "../../../components/ui/FormControls.jsx";

/** Edits a testimonial directly or promotes allowlisted fields from feedback. */
export function TestimonialEditor({ testimonial, feedback, mutation, onClose, onSaved }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(testimonialSchema),
    defaultValues: testimonial || (feedback ? feedbackToTestimonialDraft(feedback) : { customer_name: "", message: "", rating: "" }),
  });
  const busy = isSubmitting || mutation.isPending;
  const close = () => { if (!busy) onClose(); };
  const submit = handleSubmit(async (values) => {
    try { const saved = await mutation.mutateAsync({ id: testimonial?.id, values, sourceFeedbackId: feedback?.id }); onSaved(saved); onClose(); }
    catch { setError("root", { message: "The testimonial could not be saved. Your edits are still here. Please try again." }); }
  });
  return <Dialog open onClose={close} title={testimonial ? "Edit testimonial" : feedback ? "Create testimonial from feedback" : "Add testimonial"}
    description={feedback ? "Review and redact the public name and message. The private original stays intact. This saves an unpublished draft; publish separately in Testimonials." : "New testimonials are unpublished. Publication is a separate action in the list."}
    footer={<><Button variant="ghost" onClick={close} disabled={busy}>Cancel</Button><Button type="submit" form="testimonial-editor" busy={busy}>{testimonial ? "Save changes" : "Save unpublished draft"}</Button></>}>
    <form id="testimonial-editor" onSubmit={submit} noValidate className="grid gap-5"><fieldset disabled={busy} className="grid min-w-0 gap-5"><legend className="sr-only">Public testimonial content</legend>
      <TextInput label="Customer display name" required maxLength={120} error={errors.customer_name?.message} {...register("customer_name")} />
      <SelectInput label="Rating" required error={errors.rating?.message} {...register("rating")}><option value="">Choose a rating</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} out of 5</option>)}</SelectInput>
      <TextArea label="Testimonial text" required maxLength={5000} help="Only include information appropriate for public display. Remove private details from the message." error={errors.message?.message} {...register("message")} />
    </fieldset>{errors.root ? <p role="alert" className="text-sm text-danger">{errors.root.message}</p> : null}</form>
  </Dialog>;
}
