import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

interface LogoutDialogProps {
  open: boolean;
  onStay: () => void;
  onLogout: () => void;
}

export function LogoutDialog({ open, onStay, onLogout }: LogoutDialogProps) {
  return (
    <Dialog
      open={open}
      title="Logout?"
      onClose={onStay}
      footer={
        <>
          <Button variant="secondary" onClick={onStay}>
            Continue Working
          </Button>
          <Button variant="danger" onClick={onLogout}>
            Logout Anyway
          </Button>
        </>
      }
    >
      <p>
        You have an unfinished invoice. Logging out will discard your current
        entries.
      </p>
      <p className="italic text-brand-error">This action cannot be undone.</p>
    </Dialog>
  );
}
