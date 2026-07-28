export interface SaveInvoiceProductLine {
  productName: string;
  quantityDisplay: string;
  unitPriceRupees: number;
  lineTotalRupees: number;
}

export interface SaveInvoicePdfRequest {
  customerName: string;
  phoneNumber: string;
  products: SaveInvoiceProductLine[];
  discountLabel: string | null;
  discountAmountRupees: number;
  subtotalRupees: number;
  grandTotalRupees: number;
  advanceRupees: number;
  pendingRupees: number;
  invoiceDate: string;
}

export interface SaveInvoicePdfResult {
  invoiceNumber: string;
  nextInvoiceNumber: string;
  customerName: string;
  grandTotalRupees: number;
  advanceRupees: number;
  pendingRupees: number;
  folderPath: string;
  filePath: string;
}

export interface SaveInvoicePdfError {
  code: "usb_unavailable" | "file_exists" | "save_failed" | string;
  message: string;
}

export function isSaveInvoicePdfError(
  error: unknown,
): error is SaveInvoicePdfError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}
