export interface EditableInvoiceProduct {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface LoadedEditableInvoice {
  invoiceNumber: string;
  date: string;
  customerName: string;
  phoneNumber: string;
  products: EditableInvoiceProduct[];
  discount: number;
  advance: number;
  jsonPath: string;
  pdfPath: string;
  folderPath: string;
  fileName: string;
}

export interface UpdateSavedInvoiceProduct {
  name: string;
  quantity: number;
  unitPriceRupees: number;
}

export interface UpdateSavedInvoiceRequest {
  editableJsonPath: string;
  customerName: string;
  phoneNumber: string;
  products: UpdateSavedInvoiceProduct[];
  discountRupees: number;
  advanceRupees: number;
}

export type InvoiceEditorMode = "new" | "edit";

export interface InvoiceEditSession {
  mode: "edit";
  invoiceNumber: string;
  invoiceDateIso: string;
  jsonPath: string;
  pdfPath: string;
  folderPath: string;
  fileName: string;
}
