import type { DiscountType, InvoiceFormState } from "../types/invoice";
import { parsePercentageInput, parseRupeesInput } from "./money";

export function formatInvoiceDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatInvoiceDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseInvoiceDateIso(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) {
    return new Date();
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
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
