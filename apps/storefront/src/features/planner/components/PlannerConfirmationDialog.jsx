import { Button } from "../../../components/ui/Button.jsx";
import { Dialog } from "../../../components/ui/Dialog.jsx";

/** Renders the reusable confirmation step for destructive planner changes. */
export function PlannerConfirmationDialog({ open, title, description, confirmLabel, onCancel, onConfirm }) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} description={description} footer={<><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button variant="destructive" onClick={onConfirm}>{confirmLabel}</Button></>}>
      <p className="text-sm leading-6 text-muted">We'll save this change automatically after you confirm it.</p>
    </Dialog>
  );
}
