import { AlertTriangle, LoaderCircle, ShieldX, Sprout } from "lucide-react";
import { useState } from "react";

import { Button } from "../../../components/ui/Button.jsx";

const presentations = {
  loading: {
    icon: <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />,
    eyebrow: "Checking access",
    title: "Preparing the admin console",
  },
  inactive: {
    icon: <ShieldX className="size-6" aria-hidden="true" />,
    eyebrow: "Account inactive",
    title: "Administrative access is inactive",
  },
  unauthorized: {
    icon: <ShieldX className="size-6" aria-hidden="true" />,
    eyebrow: "Access denied",
    title: "This account is not a Nuede administrator",
  },
  error: {
    icon: <AlertTriangle className="size-6" aria-hidden="true" />,
    eyebrow: "Connection problem",
    title: "Administrative access could not be verified",
  },
};

export function AuthStatusPage({ type, message, actionLabel, onAction }) {
  const presentation = presentations[type];
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleAction = async () => {
    setActionBusy(true);
    setActionError("");
    try {
      await onAction();
    } catch {
      setActionError("The action could not be completed. Please try again.");
      setActionBusy(false);
    }
  };

  return <main className="grid min-h-screen place-items-center bg-canvas p-5"><section className="w-full max-w-lg rounded-dialog border border-line bg-surface p-7 text-center sm:p-10" aria-live={type === "loading" ? "polite" : "assertive"}><div className="mx-auto flex w-fit items-center gap-2 font-display text-2xl font-bold text-brand-950"><Sprout className="size-5 text-brand-700" aria-hidden="true" />nuede</div><div className="mx-auto mt-8 grid size-12 place-items-center rounded-full bg-brand-100 text-brand-700">{presentation.icon}</div><p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{presentation.eyebrow}</p><h1 className="mt-2 text-2xl font-semibold text-brand-950">{presentation.title}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">{message}</p>{actionError ? <p className="mx-auto mt-3 max-w-md text-sm text-danger" role="alert">{actionError}</p> : null}{actionLabel ? <Button className="mt-6" busy={actionBusy} onClick={handleAction}>{actionLabel}</Button> : null}</section></main>;
}
