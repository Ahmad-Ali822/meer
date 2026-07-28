import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

interface UsbUnavailableDialogProps {
  open: boolean;
  folderPath: string | null;
  onTryAgain: () => void;
  onSelectAnother: () => void;
  onClose: () => void;
}

export function UsbUnavailableDialog({
  open,
  folderPath,
  onTryAgain,
  onSelectAnother,
  onClose,
}: UsbUnavailableDialogProps) {
  return (
    <Dialog
      open={open}
      title="USB Unavailable"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onTryAgain}>
            Try Again
          </Button>
          <Button onClick={onSelectAnother}>Select Another Folder</Button>
        </>
      }
    >
      <p>
        The selected invoice folder is not available. Please reconnect your USB
        drive or choose a different folder.
      </p>
      {folderPath ? (
        <p className="break-all font-medium text-brand-text">{folderPath}</p>
      ) : null}
    </Dialog>
  );
}
