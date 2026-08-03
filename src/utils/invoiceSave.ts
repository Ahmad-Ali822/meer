import type {
  InvoiceCalculationResult,
  InvoiceFormState,
} from "../types/invoice";
import type { UpdateSavedInvoiceRequest } from "../types/invoiceEdit";
import type { SaveInvoicePdfRequest } from "../types/invoiceSave";
import {
  formatDiscountLabel,
  formatInvoiceDate,
  formatInvoiceDateIso,
  formatQuantityDisplay,
  getAdvancePaidRupees,
} from "./invoiceDisplay";
import { parseQuantityInput, parseRupeesInput } from "./money";

export function buildSaveInvoicePdfRequest(
  form: InvoiceFormState,
  totals: InvoiceCalculationResult,
  invoiceDate = new Date(),
): SaveInvoicePdfRequest {
  return {
    customerName: form.customerName.trim(),
    phoneNumber: form.phoneNumber.trim(),
    products: form.products.map((product, index) => {
      const quantity = Math.round(parseQuantityInput(product.quantity));
      return {
        productName: product.productName.trim(),
        quantity,
        quantityDisplay: formatQuantityDisplay(String(quantity)),
        unitPriceRupees: parseRupeesInput(product.unitPrice),
        lineTotalRupees: totals.lineTotalsRupees[index] ?? 0,
      };
    }),
    discountLabel: formatDiscountLabel(form.discountType, form.discountValue),
    discountAmountRupees: totals.discountAmountRupees,
    subtotalRupees: totals.subtotalRupees,
    grandTotalRupees: totals.grandTotalRupees,
    advanceRupees: getAdvancePaidRupees(form),
    pendingRupees: totals.pendingRupees,
    invoiceDate: formatInvoiceDate(invoiceDate),
    invoiceDateIso: formatInvoiceDateIso(invoiceDate),
  };
}

export function buildUpdateSavedInvoiceRequest(
  editableJsonPath: string,
  form: InvoiceFormState,
  totals: InvoiceCalculationResult,
): UpdateSavedInvoiceRequest {
  return {
    editableJsonPath,
    customerName: form.customerName.trim(),
    phoneNumber: form.phoneNumber.trim(),
    products: form.products.map((product) => ({
      name: product.productName.trim(),
      quantity: Math.round(parseQuantityInput(product.quantity)),
      unitPriceRupees: parseRupeesInput(product.unitPrice),
    })),
    discountRupees: totals.discountAmountRupees,
    advanceRupees: getAdvancePaidRupees(form),
  };
}
