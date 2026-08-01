import { useState } from "react";
import { AppFooter } from "../components/ui/AppFooter";
import { Button } from "../components/ui/Button";
import { openInvoicePdf } from "../services/invoiceOpenService";
import type { SavedInvoiceSummary } from "../types/invoice";

interface InvoiceSavedScreenProps {
  summary: SavedInvoiceSummary;
  onCreateNewInvoice: () => void;
  onHome: () => void;
}

export function InvoiceSavedScreen({
  summary,
  onCreateNewInvoice,
  onHome,
}: InvoiceSavedScreenProps) {
  const [isOpeningPdf, setIsOpeningPdf] = useState(false);
  const [openPdfError, setOpenPdfError] = useState<string | null>(null);

  async function handleOpenPdf() {
    if (isOpeningPdf) {
      return;
    }

    setIsOpeningPdf(true);
    setOpenPdfError(null);

    try {
      await openInvoicePdf(summary.filePath);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to open the PDF. Please try again.";
      setOpenPdfError(message);
    } finally {
      setIsOpeningPdf(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-brand-bg">
      <main className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg rounded-xl border border-brand-border/70 bg-white p-8 shadow-sm">
          <div className="mb-5 flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-success text-white">
              <CheckIcon />
            </span>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-brand-text">
              Invoice Saved Successfully
            </h1>
            <p className="mt-2 text-sm text-brand-muted">
              The invoice PDF has been saved to your USB drive.
            </p>
          </div>

          <dl className="mt-6 space-y-2 text-sm">
            <SummaryRow label="Invoice Number" value={summary.invoiceNumber} />
            <SummaryRow label="Customer" value={summary.customerName} />
            <SummaryRow
              label="Grand Total"
              value={formatRupees(summary.grandTotalRupees)}
            />
            <SummaryRow
              label="Advance Paid"
              value={formatRupees(summary.advanceRupees)}
            />
            <div className="flex items-center justify-between text-black">
              <dt>Pending Amount</dt>
              <dd className="font-bold">
                {formatRupees(summary.pendingRupees)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-lg border border-brand-border bg-[#eef0fb] px-4 py-3">
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-brand-navy">
              <FileIcon />
              File Location
            </p>
            <p className="mt-1 break-all text-xs text-brand-muted">
              {summary.filePath}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <Button fullWidth className="py-3" onClick={onCreateNewInvoice}>
              <PlusIcon />
              Create New Invoice
            </Button>

            <Button
              variant="secondary"
              fullWidth
              disabled={isOpeningPdf || !summary.filePath.trim()}
              onClick={() => void handleOpenPdf()}
            >
              <PdfIcon />
              {isOpeningPdf ? "Opening PDF..." : "Open PDF"}
            </Button>

            {openPdfError ? (
              <p className="text-center text-xs text-brand-error" role="alert">
                {openPdfError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={onHome}
              className="mx-auto flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-navy transition-colors hover:text-brand-navy/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20"
            >
              <HomeIcon />
              Return Home
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-brand-muted">
            Next invoice number: {summary.nextInvoiceNumber}
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-brand-muted">{label}</dt>
      <dd className="font-medium text-brand-text">{value}</dd>
    </div>
  );
}

function formatRupees(amountRupees: number): string {
  return `Rs. ${amountRupees.toLocaleString("en-PK")}`;
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="12" x2="12" y1="5" y2="19" />
      <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
