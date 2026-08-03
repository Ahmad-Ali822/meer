import { InvoiceDocument } from "../components/invoice/InvoiceDocument";
import {
  InvoicePreviewFooter,
  InvoicePreviewHeader,
} from "../components/invoice/InvoicePreviewChrome";
import type { InvoiceCalculationResult, InvoiceFormState } from "../types/invoice";
import type { InvoiceEditorMode } from "../types/invoiceEdit";
import type { InvoiceSavePlan } from "../types/invoiceNumbering";

interface InvoicePreviewScreenProps {
  form: InvoiceFormState;
  totals: InvoiceCalculationResult;
  invoiceNumber: string | null;
  invoiceDate: Date;
  savePlan: InvoiceSavePlan | null;
  mode: InvoiceEditorMode;
  isSaving: boolean;
  saveErrorMessage: string | null;
  onBackToEdit: () => void;
  onCancelEditing: () => void;
  onGenerateSave: () => void;
}

export function InvoicePreviewScreen({
  form,
  totals,
  invoiceNumber,
  invoiceDate,
  savePlan,
  mode,
  isSaving,
  saveErrorMessage,
  onBackToEdit,
  onCancelEditing,
  onGenerateSave,
}: InvoicePreviewScreenProps) {
  const isEditMode = mode === "edit";
  const folderPath = savePlan?.folderPath ?? "No USB folder selected";
  const fileName = savePlan?.fileName ?? "Invoice filename unavailable";
  const previewInvoiceNumber = invoiceNumber ?? "Unavailable";
  const saveBlocked = isEditMode ? false : !savePlan || savePlan.fileExists;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#e8eaf3]">
      <InvoicePreviewHeader invoiceNumber={previewInvoiceNumber} />

      <main className="relative min-h-0 flex-1 overflow-auto px-6 py-8">
        <div className="mx-auto flex max-w-4xl justify-center">
          <InvoiceDocument
            form={form}
            totals={totals}
            invoiceNumber={previewInvoiceNumber}
            invoiceDate={invoiceDate}
          />
        </div>
      </main>

      <InvoicePreviewFooter
        folderPath={folderPath}
        fileName={fileName}
        mode={mode}
        saveBlocked={saveBlocked || isSaving}
        isSaving={isSaving}
        onBackToEdit={onBackToEdit}
        onCancelEditing={onCancelEditing}
        onGenerateSave={onGenerateSave}
      />

      {saveBlocked && !isEditMode ? (
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
