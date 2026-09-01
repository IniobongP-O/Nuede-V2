import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { IconButton } from "./Button.jsx";

const dialogSizes = {
  default: "w-[min(42rem,calc(100%-2rem))] rounded-dialog",
  large: "h-dvh w-full max-w-none rounded-none sm:h-auto sm:w-[min(72rem,calc(100%-2rem))] sm:rounded-dialog",
};

export function Dialog({ open, onClose, title, description, children, footer, size = "default", contentClassName = "", footerClassName = "" }) {
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const lifecycleRef = useRef(0);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open && !dialog.open) {
      openerRef.current = document.activeElement;
      dialog.showModal();
      requestAnimationFrame(() => {
        const initialTarget = dialog.querySelector("[data-autofocus], button, a, input, select, textarea");
        initialTarget?.focus();
      });
    }

    if (!open && dialog.open) {
      dialog.close();
      openerRef.current?.focus?.();
    }

    return undefined;
  }, [open]);

  useEffect(() => {
    lifecycleRef.current += 1;
    const lifecycle = lifecycleRef.current;
    return () => {
      const opener = openerRef.current;
      queueMicrotask(() => {
        if (lifecycleRef.current === lifecycle) opener?.focus?.();
      });
    };
  }, []);

  function handleCancel(event) {
    event.preventDefault();
    onClose();
  }

  function handleBackdrop(event) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={`m-auto max-h-dvh overflow-y-auto border border-line bg-surface p-0 text-ink shadow-floating sm:max-h-[calc(100dvh-2rem)] ${dialogSizes[size] || dialogSizes.default}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClick={handleBackdrop}
      onClose={() => { if (open) onClose(); }}
    >
      <div className="flex items-start justify-between gap-6 border-b border-line p-5 sm:p-6">
        <div>
          <h2 id={titleId} className="font-display text-2xl text-brand-950">{title}</h2>
          {description ? <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
        </div>
        <IconButton label="Close dialog" onClick={onClose}><X className="size-5" aria-hidden="true" /></IconButton>
      </div>
      <div className={contentClassName || "p-5 sm:p-6"}>{children}</div>
      {footer ? <div className={`flex flex-wrap justify-end gap-3 border-t border-line p-5 sm:p-6 ${footerClassName}`}>{footer}</div> : null}
    </dialog>
  );
}
