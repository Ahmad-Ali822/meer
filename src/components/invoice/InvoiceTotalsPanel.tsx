import type { InvoiceFormErrors, InvoiceFormState } from "../../types/invoice";
import type { InvoiceCalculationResult } from "../../types/invoice";
import { formatRupees } from "../../utils/money";
import { Select } from "../ui/Select";

interface DiscountSectionProps {
  form: InvoiceFormState;
  totals: InvoiceCalculationResult;
  discountValueError?: string;
  onAddDiscount: () => void;
  onRemoveDiscount: () => void;
  onDiscountTypeChange: (type: "fixed" | "percentage") => void;
  onDiscountValueChange: (value: string) => void;
  onFieldBlur: () => void;
}

export function DiscountSection({
  form,
  totals,
  discountValueError,
  onAddDiscount,
  onRemoveDiscount,
  onDiscountTypeChange,
  onDiscountValueChange,
  onFieldBlur,
}: DiscountSectionProps) {
  if (form.discountType === "none") {
    return (
      <div className="flex items-center justify-between rounded-lg bg-[#eef0fb] px-4 py-2.5 text-sm">
        <span className="inline-flex items-center gap-2 text-brand-muted">
          <TagIcon />
          Discount: No Discount
        </span>
        <button
          type="button"
          onClick={onAddDiscount}
          className="font-semibold text-brand-navy underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20"
        >
          Add Discount
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-brand-border bg-[#f7f8fd] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-brand-muted">
          DISCOUNT CONFIGURATION
        </p>
        <button
          type="button"
          onClick={onRemoveDiscount}
          className="text-xs font-semibold text-brand-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/20"
        >
          Remove Discount
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Type"
          value={form.discountType}
          onChange={(event) =>
            onDiscountTypeChange(event.target.value as "fixed" | "percentage")
          }
        >
          <option value="fixed">Fixed PKR</option>
          <option value="percentage">Percentage</option>
        </Select>

        <div className="space-y-1.5">
          <label
            htmlFor="discount-value"
            className="block text-xs font-semibold uppercase tracking-wide text-brand-muted"
          >
            Value
          </label>
          <div className="relative">
            <input
              id="discount-value"
              value={form.discountValue}
              onChange={(event) => onDiscountValueChange(event.target.value)}
              onBlur={onFieldBlur}
              className={[
                "w-full rounded-lg border bg-white px-3 py-2 text-sm text-brand-text",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20 focus-visible:border-brand-navy",
                discountValueError ? "border-brand-error" : "border-brand-border",
                form.discountType === "percentage" ? "pr-8" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              inputMode="decimal"
            />
            {form.discountType === "percentage" ? (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-brand-muted">
                %
              </span>
            ) : null}
          </div>
          {discountValueError ? (
            <p className="text-xs text-brand-error">{discountValueError}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-brand-muted">Discount Amount</span>
        <span className="font-semibold text-brand-red">
          - {formatRupees(totals.discountAmountRupees)}
        </span>
      </div>
    </div>
  );
}

function TagIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

interface AdvancePaymentFieldProps {
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function AdvancePaymentField({
  value,
  error,
  onChange,
  onBlur,
}: AdvancePaymentFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label
        htmlFor="advance-payment"
        className="text-sm font-medium text-brand-text"
      >
        Advance Payment
      </label>
      <div className="w-40">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-brand-muted">
            PKR
          </span>
          <input
            id="advance-payment"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            className={[
              "w-full rounded-lg border bg-white py-2 pl-11 pr-3 text-right text-sm text-brand-text",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20 focus-visible:border-brand-navy",
              error ? "border-brand-error" : "border-brand-border",
            ]
              .filter(Boolean)
              .join(" ")}
            inputMode="decimal"
            placeholder="0.00"
          />
        </div>
        {error ? <p className="mt-1 text-xs text-brand-error">{error}</p> : null}
      </div>
    </div>
  );
}

interface InvoiceTotalsPanelProps {
  form: InvoiceFormState;
  totals: InvoiceCalculationResult;
  errors: InvoiceFormErrors | null;
  onAddDiscount: () => void;
  onRemoveDiscount: () => void;
  onDiscountTypeChange: (type: "fixed" | "percentage") => void;
  onDiscountValueChange: (value: string) => void;
  onAdvancePaymentChange: (value: string) => void;
  onFieldBlur: () => void;
}

export function InvoiceTotalsPanel({
  form,
  totals,
  errors,
  onAddDiscount,
  onRemoveDiscount,
  onDiscountTypeChange,
  onDiscountValueChange,
  onAdvancePaymentChange,
  onFieldBlur,
}: InvoiceTotalsPanelProps) {
  return (
    <div className="ml-auto w-full max-w-sm space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-brand-muted">Subtotal</span>
        <span className="font-medium text-brand-text">
          {formatRupees(totals.subtotalRupees)}
        </span>
      </div>

      <DiscountSection
        form={form}
        totals={totals}
        discountValueError={errors?.discountValue}
        onAddDiscount={onAddDiscount}
        onRemoveDiscount={onRemoveDiscount}
        onDiscountTypeChange={onDiscountTypeChange}
        onDiscountValueChange={onDiscountValueChange}
        onFieldBlur={onFieldBlur}
      />

      <div className="flex items-center justify-between border-t border-brand-border pt-3">
        <span className="text-base font-semibold text-brand-text">
          Grand Total
        </span>
        <span className="text-xl font-bold text-brand-navy">
          {formatRupees(totals.grandTotalRupees)}
        </span>
      </div>

      <AdvancePaymentField
        value={form.advancePayment}
        error={errors?.advancePayment}
        onChange={onAdvancePaymentChange}
        onBlur={onFieldBlur}
      />

      <div className="flex items-center justify-between rounded-lg bg-brand-navy px-4 py-3 text-white">
        <span className="text-xs font-semibold tracking-wider">
          PENDING AMOUNT
        </span>
        <span className="text-lg font-bold">
          {formatRupees(totals.pendingRupees)}
        </span>
      </div>
    </div>
  );
}
