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
        <div className="mx-auto flex max-w-4xl justify-center">
          <InvoiceDocument
            form={form}
            totals={totals}
            invoiceNumber={previewInvoiceNumber}
          />
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
