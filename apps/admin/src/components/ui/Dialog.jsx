import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { IconButton } from "./Button.jsx";

export function Dialog({ open, onClose, title, description, children, footer }) {
  const ref = useRef(null); const opener = useRef(null); const titleId = useId(); const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    return () => {
      const target = opener.current;
      queueMicrotask(() => { if (!dialog?.isConnected) target?.focus?.(); });
    };
  }, []);
  useEffect(() => { const dialog = ref.current; if (!dialog) return; if (open && !dialog.open) { opener.current = document.activeElement; dialog.showModal(); requestAnimationFrame(() => dialog.querySelector("[data-autofocus], button, a, input, select, textarea")?.focus()); } if (!open && dialog.open) { dialog.close(); opener.current?.focus?.(); } }, [open]);
  return <dialog ref={ref} className="m-auto max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] overflow-y-auto rounded-dialog border border-line bg-surface p-0 text-ink shadow-floating" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} onClose={() => { if (open) onClose(); }}><div className="flex items-start justify-between gap-6 border-b border-line p-5 sm:p-6"><div><h2 id={titleId} className="text-xl font-semibold text-brand-950">{title}</h2>{description ? <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}</div><IconButton label="Close dialog" onClick={onClose}><X className="size-5" /></IconButton></div><div className="p-5 sm:p-6">{children}</div>{footer ? <div className="flex flex-wrap justify-end gap-3 border-t border-line p-5 sm:p-6">{footer}</div> : null}</dialog>;
}
