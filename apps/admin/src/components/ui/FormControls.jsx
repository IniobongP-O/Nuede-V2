import { useId } from "react";

const control = "min-h-11 w-full rounded-control border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted/70 hover:border-muted focus:border-brand-700 disabled:cursor-not-allowed disabled:bg-line/40";

function Field({ id, label, help, error, required, children, className = "" }) {
  const descriptionId = help || error ? `${id}-description` : undefined;
  return <div className={`grid gap-2 ${className}`}><label htmlFor={id} className="text-sm font-semibold text-brand-950">{label}{required ? <span className="ml-1 text-danger" aria-hidden="true">*</span> : null}</label>{children(descriptionId)}{error ? <p id={descriptionId} className="text-sm text-danger">{error}</p> : help ? <p id={descriptionId} className="text-sm text-muted">{help}</p> : null}</div>;
}

export function TextInput({ id: providedId, label, help, error, required = false, fieldClassName = "", ...props }) {
  const generatedId = useId(); const id = providedId || generatedId;
  return <Field id={id} label={label} help={help} error={error} required={required} className={fieldClassName}>{(descriptionId) => <input id={id} className={`${control} ${error ? "border-danger" : ""}`} required={required} aria-invalid={Boolean(error)} aria-describedby={descriptionId} {...props} />}</Field>;
}

export function SelectInput({ id: providedId, label, help, error, required = false, fieldClassName = "", children, ...props }) {
  const generatedId = useId(); const id = providedId || generatedId;
  return <Field id={id} label={label} help={help} error={error} required={required} className={fieldClassName}>{(descriptionId) => <select id={id} className={`${control} ${error ? "border-danger" : ""}`} required={required} aria-invalid={Boolean(error)} aria-describedby={descriptionId} {...props}>{children}</select>}</Field>;
}

export function TextArea({ id: providedId, label, help, error, required = false, fieldClassName = "", ...props }) {
  const generatedId = useId(); const id = providedId || generatedId;
  return <Field id={id} label={label} help={help} error={error} required={required} className={fieldClassName}>{(descriptionId) => <textarea id={id} className={`${control} min-h-28 resize-y py-3 ${error ? "border-danger" : ""}`} required={required} aria-invalid={Boolean(error)} aria-describedby={descriptionId} {...props} />}</Field>;
}

export function CheckboxField({ id: providedId, label, help, ...props }) {
  const generatedId = useId(); const id = providedId || generatedId;
  return <div className="flex items-start gap-3"><input id={id} type="checkbox" className="mt-1 size-4 accent-brand-700" aria-describedby={help ? `${id}-help` : undefined} {...props} /><div><label htmlFor={id} className="text-sm font-semibold text-brand-950">{label}</label>{help ? <p id={`${id}-help`} className="mt-1 text-sm text-muted">{help}</p> : null}</div></div>;
}
