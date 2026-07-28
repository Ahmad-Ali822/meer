import type {
  InvoiceCalculationResult,
  InvoiceFormState,
} from "../types/invoice";
import type { SaveInvoicePdfRequest } from "../types/invoiceSave";
import {
  formatDiscountLabel,
  formatInvoiceDate,
  formatQuantityDisplay,
  getAdvancePaidRupees,
} from "./invoiceDisplay";
import { parseRupeesInput } from "./money";

export function buildSaveInvoicePdfRequest(
  form: InvoiceFormState,
  totals: InvoiceCalculationResult,
  invoiceDate = new Date(),
): SaveInvoicePdfRequest {
  return {
    customerName: form.customerName.trim(),
    phoneNumber: form.phoneNumber.trim(),
    products: form.products.map((product, index) => ({
      productName: product.productName.trim(),
      quantityDisplay: formatQuantityDisplay(product.quantity),
      unitPriceRupees: parseRupeesInput(product.unitPrice),
      lineTotalRupees: totals.lineTotalsRupees[index] ?? 0,
    })),
    discountLabel: formatDiscountLabel(form.discountType, form.discountValue),
    discountAmountRupees: totals.discountAmountRupees,
    subtotalRupees: totals.subtotalRupees,
    grandTotalRupees: totals.grandTotalRupees,
    advanceRupees: getAdvancePaidRupees(form),
    pendingRupees: totals.pendingRupees,
    invoiceDate: formatInvoiceDate(invoiceDate),
  };
}
