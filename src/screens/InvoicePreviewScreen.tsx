import type { ReactNode } from "react";
import { InvoiceDocument } from "../components/invoice/InvoiceDocument";
import {
  InvoicePreviewFooter,
  InvoicePreviewHeader,
} from "../components/invoice/InvoicePreviewChrome";
import type { InvoiceCalculationResult, InvoiceFormState } from "../types/invoice";
import type { InvoiceSavePlan } from "../types/invoiceNumbering";

interface InvoicePreviewScreenProps {
  form: InvoiceFormState;
  totals: InvoiceCalculationResult;
  invoiceNumber: string | null;
  savePlan: InvoiceSavePlan | null;
  isSaving: boolean;
  saveErrorMessage: string | null;
  onBackToEdit: () => void;
  onGenerateSave: () => void;
}

export function InvoicePreviewScreen({
  form,
  totals,
  invoiceNumber,
  savePlan,
  isSaving,
  saveErrorMessage,
  onBackToEdit,
  onGenerateSave,
}: InvoicePreviewScreenProps) {
  const folderPath = savePlan?.folderPath ?? "No USB folder selected";
  const fileName = savePlan?.fileName ?? "Invoice filename unavailable";
  const previewInvoiceNumber = invoiceNumber ?? "Unavailable";
  const saveBlocked = !savePlan || savePlan.fileExists;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#e8eaf3]">
      <InvoicePreviewHeader invoiceNumber={previewInvoiceNumber} />

      <main className="relative min-h-0 flex-1 overflow-auto px-6 py-8">
        <div className="mx-auto flex max-w-4xl justify-center gap-4">
          <InvoiceDocument
            form={form}
            totals={totals}
            invoiceNumber={previewInvoiceNumber}
          />

          <div className="hidden shrink-0 flex-col gap-2 lg:flex">
            <PreviewToolButton label="Zoom in" disabled>
              <ZoomInIcon />
            </PreviewToolButton>
            <PreviewToolButton label="Zoom out" disabled>
              <ZoomOutIcon />
            </PreviewToolButton>
            <PreviewToolButton label="Print" disabled>
              <PrintIcon />
            </PreviewToolButton>
          </div>
        </div>
      </main>

      <InvoicePreviewFooter
        folderPath={folderPath}
        fileName={fileName}
        saveBlocked={saveBlocked || isSaving}
        isSaving={isSaving}
        onBackToEdit={onBackToEdit}
        onGenerateSave={onGenerateSave}
      />

      {saveBlocked ? (
        <p className="px-6 pb-3 text-right text-xs text-brand-error">
          Select an available USB folder before saving this invoice.
        </p>
      ) : null}

      {saveErrorMessage ? (
        <p className="px-6 pb-3 text-right text-xs text-brand-error">
          {saveErrorMessage}
        </p>
      ) : null}
    </div>
  );
}

function PreviewToolButton({
  label,
  disabled,
  children,
}: {
  label: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-border bg-white text-brand-muted shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function ZoomInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" x2="16.65" y1="21" y2="16.65" />
      <line x1="11" x2="11" y1="8" y2="14" />
      <line x1="8" x2="14" y1="11" y2="11" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" x2="16.65" y1="21" y2="16.65" />
      <line x1="8" x2="14" y1="11" y2="11" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}
