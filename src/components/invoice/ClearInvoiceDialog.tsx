import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

interface ClearInvoiceDialogProps {
  open: boolean;
  onContinue: () => void;
  onConfirm: () => void;
}

export function ClearInvoiceDialog({
  open,
  onContinue,
  onConfirm,
}: ClearInvoiceDialogProps) {
  return (
    <Dialog
      open={open}
      title="Clear Invoice?"
      onClose={onContinue}
      footer={
        <>
          <Button variant="secondary" onClick={onContinue}>
            Continue Editing
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            <TrashIcon />
            Clear Invoice
          </Button>
        </>
      }
    >
      <p>
        All entered customer, product, discount and advance information will be
        removed.
      </p>
      <p className="italic text-brand-error">This action cannot be undone.</p>
    </Dialog>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
