import type { DiscountType, InvoiceFormState } from "../types/invoice";
import { parsePercentageInput, parseRupeesInput } from "./money";

export function formatInvoiceDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDiscountLabel(
  discountType: DiscountType,
  discountValue: string,
): string | null {
  if (discountType === "none") {
    return null;
  }

  if (discountType === "percentage") {
    const percentage = parsePercentageInput(discountValue);
    return percentage > 0 ? `Discount (${percentage}%)` : "Discount";
  }

  return "Discount";
}

export function getAdvancePaidRupees(form: InvoiceFormState): number {
  return parseRupeesInput(form.advancePayment);
}

export function formatQuantityDisplay(quantity: string): string {
  const parsed = Number(quantity.replace(/,/g, "").trim());
  if (!Number.isFinite(parsed)) {
    return quantity;
  }

  return Number.isInteger(parsed)
    ? String(parsed)
    : parsed.toLocaleString("en-PK", { maximumFractionDigits: 2 });
}
