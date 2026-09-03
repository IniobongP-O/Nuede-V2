import { Button } from "../../../components/ui/Button.jsx";
import { Dialog } from "../../../components/ui/Dialog.jsx";

export function PlannerConfirmationDialog({ open, title, description, confirmLabel, onCancel, onConfirm }) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} description={description} footer={<><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button variant="destructive" onClick={onConfirm}>{confirmLabel}</Button></>}>
      <p className="text-sm leading-6 text-muted">This change is saved automatically on this device after you confirm it.</p>
    </Dialog>
  );
}
