import { useState } from "react";
import { ClearInvoiceDialog } from "../components/invoice/ClearInvoiceDialog";
import { InvoiceFormHeader } from "../components/invoice/InvoiceFormHeader";
import { InvoiceTotalsPanel } from "../components/invoice/InvoiceTotalsPanel";
import { LeaveFormDialog } from "../components/invoice/LeaveFormDialog";
import { ProductRowsTable } from "../components/invoice/ProductRowsTable";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import type { useInvoiceForm } from "../hooks/useInvoiceForm";
import { APP_VERSION } from "../theme/brand";
import { PLACEHOLDER_INVOICE_NUMBER } from "../types/invoice";
import { formatInvoiceDate } from "../utils/invoiceDisplay";
import { hasInvoiceFormErrors } from "../utils/invoiceValidation";

type InvoiceFormController = ReturnType<typeof useInvoiceForm>;

interface InvoiceFormScreenProps {
  invoiceForm: InvoiceFormController;
  onHome: () => void;
  onPreview: () => void;
}

export function InvoiceFormScreen({
  invoiceForm,
  onHome,
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
    clearForm,
    touchValidation,
  } = invoiceForm;

  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const invoiceDate = formatInvoiceDate(new Date());
  const previewBlocked = errors !== null && hasInvoiceFormErrors(errors);

  function handleHomeRequest() {
    if (isDirty) {
      setShowLeaveDialog(true);
      return;
    }

    onHome();
  }

  function handleClearRequest() {
    if (!isDirty) {
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
              <h1 className="text-2xl font-bold text-brand-navy">
                Create New Invoice
              </h1>
              <p className="mt-1 text-sm text-brand-muted">
                Generate professional documents for your clients.
              </p>
            </div>

            <div className="flex gap-8 text-right">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-brand-muted">
                  INVOICE #
                </p>
                <p className="text-sm font-bold text-brand-navy">
                  {PLACEHOLDER_INVOICE_NUMBER}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-brand-muted">
                  DATE
                </p>
                <p className="text-sm font-bold text-brand-navy">{invoiceDate}</p>
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
                placeholder="Enter full name"
                value={form.customerName}
                error={Boolean(errors?.customerName)}
                errorMessage={errors?.customerName}
                onChange={(event) => updateCustomerName(event.target.value)}
                onBlur={touchValidation}
              />
              <Input
                label="Phone Number *"
                placeholder="+92 3XX XXXXXXX"
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
          <button
            type="button"
            onClick={handleClearRequest}
            disabled={!isDirty}
            className="text-sm font-medium text-brand-muted transition-colors hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear Form
          </button>
          <span className="text-brand-border">|</span>
          <span className="text-xs italic text-brand-muted">{APP_VERSION}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={onPreview}>
            <EyeIcon />
            Preview Invoice
          </Button>
          <Button disabled>
            <PdfIcon />
            Generate &amp; Save PDF
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
          clearForm();
          setShowClearDialog(false);
        }}
      />

      <LeaveFormDialog
        open={showLeaveDialog}
        onStay={() => setShowLeaveDialog(false)}
        onLeave={() => {
          setShowLeaveDialog(false);
          onHome();
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

function PdfIcon() {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
    </svg>
  );
}
