import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

interface LeaveFormDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export function LeaveFormDialog({ open, onStay, onLeave }: LeaveFormDialogProps) {
  return (
    <Dialog
      open={open}
      title="Leave Invoice?"
      onClose={onStay}
      footer={
        <>
          <Button variant="secondary" onClick={onStay}>
            Continue Editing
          </Button>
          <Button variant="danger" onClick={onLeave}>
            Leave Without Saving
          </Button>
        </>
      }
    >
      <p>
        You have unsaved invoice details. Leaving now will discard your current
        entries.
      </p>
      <p className="italic text-brand-error">This action cannot be undone.</p>
    </Dialog>
  );
}
