import { Button } from "../ui/Button";

interface InvoicePreviewHeaderProps {
  invoiceNumber: string;
}

export function InvoicePreviewHeader({
  invoiceNumber,
}: InvoicePreviewHeaderProps) {
  return (
    <header className="flex items-center justify-between bg-brand-navy px-5 py-3 text-white">
      <p className="text-sm font-bold tracking-wide">
        MEER ILYAS DESKTOP
        <span className="mx-2 font-normal text-white/70">|</span>
        Invoice Preview: {invoiceNumber}
      </p>
    </header>
  );
}

interface InvoicePreviewFooterProps {
  folderPath: string;
  fileName: string;
  saveBlocked?: boolean;
  isSaving?: boolean;
  onBackToEdit: () => void;
  onGenerateSave: () => void;
}

export function InvoicePreviewFooter({
  folderPath,
  fileName,
  saveBlocked = false,
  isSaving = false,
  onBackToEdit,
  onGenerateSave,
}: InvoicePreviewFooterProps) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border bg-white px-6 py-3">
      <div className="min-w-0 text-xs text-brand-muted">
        <p className="inline-flex items-center gap-1.5 truncate">
          <FolderIcon />
          {folderPath}
        </p>
        <p className="mt-0.5 inline-flex items-center gap-1.5 truncate">
          <FileIcon />
          {fileName}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={onBackToEdit}>
          <EditIcon />
          Back to Edit
        </Button>
        <Button onClick={onGenerateSave} disabled={saveBlocked}>
          <SaveIcon />
          {isSaving ? "Saving..." : "Generate & Save PDF"}
        </Button>
      </div>
    </footer>
  );
}

function FolderIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function EditIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function SaveIcon() {
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
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
