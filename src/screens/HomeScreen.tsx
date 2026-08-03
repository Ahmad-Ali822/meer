import logo from "../assets/Logo.jpeg";
import { UsbUnavailableDialog } from "../components/invoice/UsbUnavailableDialog";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import type { useInvoiceFolder } from "../hooks/useInvoiceFolder";
import { APP_NAME } from "../theme/brand";

type InvoiceFolderController = ReturnType<typeof useInvoiceFolder>;

interface HomeScreenProps {
  invoiceFolder: InvoiceFolderController;
  onLogout: () => void;
  onCreateInvoice: () => void;
  onEditSavedInvoice: () => void;
  isLoadingEdit?: boolean;
  editErrorMessage?: string | null;
}

export function HomeScreen({
  invoiceFolder,
  onLogout,
  onCreateInvoice,
  onEditSavedInvoice,
  isLoadingEdit = false,
  editErrorMessage = null,
}: HomeScreenProps) {
  const {
    status,
    isLoading,
    isSelectingFolder,
    showUsbWarning,
    selectFolder,
    tryAgain,
    selectAnotherFolder,
    dismissUsbWarning,
  } = invoiceFolder;

  const hasSelectedFolder = Boolean(status.path);
  const folderLabel = status.path ?? "No USB folder selected";
  const folderStatusText = isLoading
    ? "Checking folder..."
    : hasSelectedFolder
      ? status.isAvailable
        ? "Available"
        : "Unavailable"
      : null;
  const folderBusy = isLoading || isSelectingFolder;

  return (
    <AppShell footerVariant="home" showHeader onLogout={onLogout}>
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl rounded-xl border border-brand-border/70 bg-white p-8 shadow-sm">
          <div className="mb-6 flex justify-center">
            <img
              src={logo}
              alt="Meer Ilyas logo"
              className="h-auto w-28 max-w-full object-contain"
            />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-brand-text">
              Welcome to {APP_NAME}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-brand-muted">
              Create a customer invoice and save it as a PDF to your USB drive.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              className="px-6 py-3 text-base"
              onClick={onCreateInvoice}
              disabled={isLoadingEdit}
            >
              <PlusIcon />
              Generate New Invoice
            </Button>
            <Button
              variant="secondary"
              className="px-6 py-3 text-base"
              onClick={onEditSavedInvoice}
              disabled={isLoadingEdit}
            >
              <EditIcon />
              {isLoadingEdit ? "Opening..." : "Edit Saved Invoice"}
            </Button>
          </div>

          {editErrorMessage ? (
            <p className="mt-3 text-center text-sm text-brand-error">
              {editErrorMessage}
            </p>
          ) : null}

          <div className="mt-6 rounded-lg border border-brand-border bg-brand-bg/60 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-brand-navy">
                  <UsbIcon unavailable={hasSelectedFolder && !status.isAvailable} />
                </span>
                <div className="min-w-0 text-left">
                  <p className="text-[10px] font-semibold tracking-wider text-brand-muted">
                    INVOICE FOLDER
                  </p>
                  <p
                    className={`truncate text-sm ${
                      hasSelectedFolder && !status.isAvailable
                        ? "text-brand-error"
                        : "text-brand-text"
                    }`}
                    title={status.path ?? undefined}
                  >
                    {folderLabel}
                  </p>
                  {folderStatusText ? (
                    <p
                      className={`text-xs ${
                        hasSelectedFolder && !status.isAvailable
                          ? "text-brand-error"
                          : "text-brand-success"
                      }`}
                    >
                      {folderStatusText}
                    </p>
                  ) : null}
                </div>
              </div>
              <Button
                variant="secondary"
                className="shrink-0"
                disabled={folderBusy}
                onClick={() => void selectFolder()}
              >
                {isSelectingFolder
                  ? "Selecting..."
                  : hasSelectedFolder
                    ? "Change USB Folder"
                    : "Select USB Folder"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <UsbUnavailableDialog
        open={showUsbWarning}
        folderPath={status.path}
        onTryAgain={() => void tryAgain()}
        onSelectAnother={() => void selectAnotherFolder()}
        onClose={dismissUsbWarning}
      />
    </AppShell>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="12" x2="12" y1="5" y2="19" />
      <line x1="5" x2="19" y1="12" y2="12" />
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

function UsbIcon({ unavailable }: { unavailable: boolean }) {
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
      className={unavailable ? "text-brand-error" : undefined}
      aria-hidden="true"
    >
      <circle cx="10" cy="7" r="1" />
      <circle cx="4" cy="20" r="1" />
      <path d="M4.7 19.3 10 7" />
      <path d="m14 7 3 3 3-3" />
      <path d="M17 10v7a2 2 0 0 1-2 2H9" />
    </svg>
  );
}
