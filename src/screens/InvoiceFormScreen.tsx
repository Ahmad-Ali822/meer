import { useState } from "react";
import { ClearInvoiceDialog } from "../components/invoice/ClearInvoiceDialog";
import { InvoiceFormHeader } from "../components/invoice/InvoiceFormHeader";
import { InvoiceTotalsPanel } from "../components/invoice/InvoiceTotalsPanel";
import { LeaveFormDialog } from "../components/invoice/LeaveFormDialog";
import { ProductRowsTable } from "../components/invoice/ProductRowsTable";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import type { useInvoiceForm } from "../hooks/useInvoiceForm";
import type { InvoiceEditorMode } from "../types/invoiceEdit";
import { APP_VERSION } from "../theme/brand";
import { formatInvoiceDate } from "../utils/invoiceDisplay";
import { hasInvoiceFormErrors } from "../utils/invoiceValidation";

type InvoiceFormController = ReturnType<typeof useInvoiceForm>;

interface InvoiceFormScreenProps {
  invoiceForm: InvoiceFormController;
  mode: InvoiceEditorMode;
  invoiceNumber: string | null;
  invoiceNumberLoading: boolean;
  invoiceDate: Date;
  isPreviewLoading: boolean;
  onResetInvoice: () => void;
  onDiscardAndHome: () => void;
  onCancelEditing: () => void;
  onPreview: () => void;
}

export function InvoiceFormScreen({
  invoiceForm,
  mode,
  invoiceNumber,
  invoiceNumberLoading,
  invoiceDate,
  isPreviewLoading,
  onResetInvoice,
  onDiscardAndHome,
  onCancelEditing,
  onPreview,
}: InvoiceFormScreenProps) {
  const {
    form,
    totals,
    errors,
    isDirty,
    updateCustomerName,
    updatePhoneNumber,
    updateProduct,
    addProductRow,
    removeProductRow,
    setDiscountType,
    updateDiscountValue,
    updateAdvancePayment,
    touchValidation,
  } = invoiceForm;

  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const isEditMode = mode === "edit";

  const previewBlocked = errors !== null && hasInvoiceFormErrors(errors);
  const invoiceNumberLabel = invoiceNumberLoading
    ? "Loading..."
    : invoiceNumber ?? "Unavailable";
  const heading = isEditMode
    ? `Editing Invoice: ${invoiceNumber ?? "Unavailable"}`
    : "Create New Invoice";

  function handleHomeRequest() {
    if (isDirty || isEditMode) {
      setShowLeaveDialog(true);
      return;
    }

    onDiscardAndHome();
  }

  function handleClearRequest() {
    if (!isDirty || isEditMode) {
      return;
    }

    setShowClearDialog(true);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-brand-bg">
      <InvoiceFormHeader onHome={handleHomeRequest} />

      <main className="min-h-0 flex-1 overflow-auto px-6 py-5">
        <div className="mx-auto max-w-5xl rounded-xl border border-brand-border/70 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-brand-navy">{heading}</h1>
              <p className="mt-1 text-sm text-brand-muted">
                {isEditMode
                  ? "Update the saved invoice details, then preview and save changes."
                  : "Generate professional documents for your clients."}
              </p>
            </div>

            <div className="flex gap-8 text-right">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-brand-muted">
                  INVOICE #
                </p>
                <p className="text-sm font-bold text-brand-navy">
                  {invoiceNumberLabel}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-brand-muted">
                  DATE
                </p>
                <p className="text-sm font-bold text-brand-navy">
                  {formatInvoiceDate(invoiceDate)}
                </p>
              </div>
            </div>
          </div>

          <section className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <UserIcon />
              <h2 className="text-sm font-bold text-brand-navy">
                Customer Details
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Customer Name *"
                placeholder=""
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={form.customerName}
                error={Boolean(errors?.customerName)}
                errorMessage={errors?.customerName}
                onChange={(event) => updateCustomerName(event.target.value)}
                onBlur={touchValidation}
              />
              <Input
                label="Phone Number *"
                placeholder=""
                autoComplete="off"
                inputMode="tel"
                spellCheck={false}
                value={form.phoneNumber}
                error={Boolean(errors?.phoneNumber)}
                errorMessage={errors?.phoneNumber}
                onChange={(event) => updatePhoneNumber(event.target.value)}
                onBlur={touchValidation}
              />
            </div>
          </section>

          <ProductRowsTable
            products={form.products}
            lineTotalsRupees={totals.lineTotalsRupees}
            errors={errors}
            onProductChange={updateProduct}
            onAddRow={addProductRow}
            onRemoveRow={removeProductRow}
            onFieldBlur={touchValidation}
          />

          <div className="mt-6 flex justify-end">
            <InvoiceTotalsPanel
              form={form}
              totals={totals}
              errors={errors}
              onAddDiscount={() => setDiscountType("fixed")}
              onRemoveDiscount={() => setDiscountType("none")}
              onDiscountTypeChange={setDiscountType}
              onDiscountValueChange={updateDiscountValue}
              onAdvancePaymentChange={updateAdvancePayment}
              onFieldBlur={touchValidation}
            />
          </div>
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <Button
              variant="secondary"
              onClick={onCancelEditing}
              disabled={isPreviewLoading}
            >
              Cancel Editing
            </Button>
          ) : (
            <button
              type="button"
              onClick={handleClearRequest}
              disabled={!isDirty}
              className="cursor-pointer text-sm font-medium text-brand-muted transition-colors hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear Form
            </button>
          )}
          <span className="text-brand-border">|</span>
          <span className="text-xs italic text-brand-muted">{APP_VERSION}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => void onPreview()}
            disabled={isPreviewLoading || previewBlocked}
          >
            <EyeIcon />
            {isPreviewLoading ? "Opening Preview..." : "Preview Invoice"}
          </Button>
        </div>
      </footer>

      {previewBlocked ? (
        <p className="px-6 pb-3 text-right text-xs text-brand-error">
          Fix validation errors before previewing the invoice.
        </p>
      ) : null}

      <ClearInvoiceDialog
        open={showClearDialog}
        onContinue={() => setShowClearDialog(false)}
        onConfirm={() => {
          onResetInvoice();
          setShowClearDialog(false);
        }}
      />

      <LeaveFormDialog
        open={showLeaveDialog}
        onStay={() => setShowLeaveDialog(false)}
        onLeave={() => {
          setShowLeaveDialog(false);
          onDiscardAndHome();
        }}
      />
    </div>
  );
}

function UserIcon() {
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
      className="text-brand-navy"
      aria-hidden="true"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function EyeIcon() {
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
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
