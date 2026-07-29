import type {
  DiscountType,
  InvoiceCalculationInput,
  InvoiceCalculationResult,
  InvoiceFormState,
} from "../types/invoice";
import { parsePercentageInput, parseQuantityInput, parseRupeesInput } from "./money";

function calculateLineTotalRupees(
  quantity: number,
  unitPriceRupees: number,
): number {
  return Math.round(quantity * unitPriceRupees);
}

function calculateDiscountAmountRupees(
  subtotalRupees: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  if (subtotalRupees <= 0 || discountType === "none" || discountValue <= 0) {
    return 0;
  }

  let discountAmountRupees = 0;

  if (discountType === "fixed") {
    discountAmountRupees = Math.round(discountValue);
  }

  if (discountType === "percentage") {
    discountAmountRupees = Math.round((subtotalRupees * discountValue) / 100);
  }

  return Math.min(discountAmountRupees, subtotalRupees);
}

export function calculateInvoiceTotals(
  input: InvoiceCalculationInput,
): InvoiceCalculationResult {
  const lineTotalsRupees = input.lines.map((line) =>
    calculateLineTotalRupees(line.quantity, line.unitPriceRupees),
  );

  const subtotalRupees = lineTotalsRupees.reduce(
    (total, lineTotal) => total + lineTotal,
    0,
  );

  const discountAmountRupees = calculateDiscountAmountRupees(
    subtotalRupees,
    input.discountType,
    input.discountValue,
  );

  const grandTotalRupees = subtotalRupees - discountAmountRupees;
  const cappedAdvanceRupees = Math.min(
    Math.max(input.advanceRupees, 0),
    grandTotalRupees,
  );
  const pendingRupees = grandTotalRupees - cappedAdvanceRupees;

  return {
    lineTotalsRupees,
    subtotalRupees,
    discountAmountRupees,
    grandTotalRupees,
    pendingRupees,
  };
}

export function buildCalculationInput(
  form: InvoiceFormState,
): InvoiceCalculationInput {
  return {
    lines: form.products.map((product) => ({
      quantity: parseQuantityInput(product.quantity),
      unitPriceRupees: parseRupeesInput(product.unitPrice),
    })),
    discountType: form.discountType,
    discountValue:
      form.discountType === "percentage"
        ? parsePercentageInput(form.discountValue)
        : parseRupeesInput(form.discountValue),
    advanceRupees: parseRupeesInput(form.advancePayment),
  };
}

export function calculateInvoiceFromForm(
  form: InvoiceFormState,
): InvoiceCalculationResult {
  return calculateInvoiceTotals(buildCalculationInput(form));
}
