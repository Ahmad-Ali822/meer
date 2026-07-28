export type DiscountType = "none" | "fixed" | "percentage";

export interface ProductRow {
  id: string;
  productName: string;
  quantity: string;
  unitPrice: string;
}

export interface InvoiceFormState {
  customerName: string;
  phoneNumber: string;
  products: ProductRow[];
  discountType: DiscountType;
  discountValue: string;
  advancePayment: string;
}

export interface ProductRowErrors {
  productName?: string;
  quantity?: string;
  unitPrice?: string;
}

export interface InvoiceFormErrors {
  customerName?: string;
  phoneNumber?: string;
  products: Record<string, ProductRowErrors>;
  discountValue?: string;
  advancePayment?: string;
}

export interface InvoiceCalculationLineInput {
  quantity: number;
  unitPriceRupees: number;
}

export interface InvoiceCalculationInput {
  lines: InvoiceCalculationLineInput[];
  discountType: DiscountType;
  discountValue: number;
  advanceRupees: number;
}

export interface InvoiceCalculationResult {
  lineTotalsRupees: number[];
  subtotalRupees: number;
  discountAmountRupees: number;
  grandTotalRupees: number;
  pendingRupees: number;
}

export interface SavedInvoiceSummary {
  invoiceNumber: string;
  customerName: string;
  grandTotalRupees: number;
  advanceRupees: number;
  pendingRupees: number;
  folderPath: string;
  filePath: string;
  nextInvoiceNumber: string;
}
