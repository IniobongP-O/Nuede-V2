import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { ToastContext } from "./toastContext.js";

/** Owns transient admin notifications and exposes the toast API to descendants. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]); const nextId = useRef(0);
  const dismiss = useCallback((id) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const notify = useCallback((message, tone = "success") => { nextId.current += 1; const id = nextId.current; setToasts((current) => [...current, { id, message, tone }]); window.setTimeout(() => dismiss(id), 4500); }, [dismiss]);
  const value = useMemo(() => ({ notify }), [notify]);
  return <ToastContext.Provider value={value}>{children}<div className="fixed bottom-4 right-4 z-50 grid w-[min(24rem,calc(100%-2rem))] gap-3" role="region" aria-live="polite" aria-label="Notifications">{toasts.map((toast) => <div key={toast.id} className="flex items-start gap-3 rounded-card border border-line bg-brand-950 p-4 text-white shadow-floating" role={toast.tone === "error" ? "alert" : "status"}>{toast.tone === "error" ? <CircleAlert className="mt-0.5 size-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0" />}<p className="flex-1 text-sm leading-6">{toast.message}</p><button type="button" className="rounded p-1" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}><X className="size-4" /></button></div>)}</div></ToastContext.Provider>;
}
