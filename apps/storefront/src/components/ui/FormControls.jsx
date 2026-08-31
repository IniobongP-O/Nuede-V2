import { useId } from "react";

const controlClasses = "min-h-11 w-full rounded-control border border-line bg-surface px-3.5 text-sm text-ink transition-colors placeholder:text-muted/70 hover:border-muted focus:border-brand-700 disabled:cursor-not-allowed disabled:bg-line/40 disabled:text-muted";

function FieldShell({ id, label, required, help, error, children, className = "" }) {
  const descriptionId = help || error ? `${id}-description` : undefined;
  return (
    <div className={`grid gap-2 ${className}`}>
      <label className="text-sm font-semibold text-brand-950" htmlFor={id}>
        {label}{required ? <span className="ml-1 text-danger" aria-hidden="true">*</span> : null}
      </label>
      {children({ descriptionId })}
      {error ? <p id={descriptionId} className="text-sm text-danger">{error}</p> : null}
      {!error && help ? <p id={descriptionId} className="text-sm text-muted">{help}</p> : null}
    </div>
  );
}

export function TextInput({ id: suppliedId, label, help, error, required = false, className = "", fieldClassName = "", ...props }) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return (
    <FieldShell id={id} label={label} help={help} error={error} required={required} className={fieldClassName}>
      {({ descriptionId }) => (
        <input id={id} className={`${controlClasses} ${error ? "border-danger" : ""} ${className}`} required={required} aria-invalid={Boolean(error)} aria-describedby={descriptionId} {...props} />
      )}
    </FieldShell>
  );
}

export function SelectInput({ id: suppliedId, label, help, error, required = false, children, className = "", fieldClassName = "", ...props }) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return (
    <FieldShell id={id} label={label} help={help} error={error} required={required} className={fieldClassName}>
      {({ descriptionId }) => (
        <select id={id} className={`${controlClasses} ${error ? "border-danger" : ""} ${className}`} required={required} aria-invalid={Boolean(error)} aria-describedby={descriptionId} {...props}>
          {children}
        </select>
      )}
    </FieldShell>
  );
}

export function TextArea({ id: suppliedId, label, help, error, required = false, className = "", fieldClassName = "", ...props }) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return (
    <FieldShell id={id} label={label} help={help} error={error} required={required} className={fieldClassName}>
      {({ descriptionId }) => (
        <textarea id={id} className={`${controlClasses} min-h-28 resize-y py-3 ${error ? "border-danger" : ""} ${className}`} required={required} aria-invalid={Boolean(error)} aria-describedby={descriptionId} {...props} />
      )}
    </FieldShell>
  );
}

export function CheckboxField({ id: suppliedId, label, help, ...props }) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" className="mt-1 size-4 accent-brand-700" aria-describedby={help ? `${id}-help` : undefined} {...props} />
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-brand-950">{label}</label>
        {help ? <p id={`${id}-help`} className="mt-1 text-sm text-muted">{help}</p> : null}
      </div>
    </div>
  );
}
