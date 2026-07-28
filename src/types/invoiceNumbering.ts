export interface ProposedInvoiceNumber {
  invoiceNumber: string;
  nextInvoiceNumber: string;
  year: number;
  sequence: number;
}

export interface InvoiceSavePlan {
  invoiceNumber: string;
  nextInvoiceNumber: string;
  year: number;
  sequence: number;
  folderPath: string;
  fileName: string;
  filePath: string;
  fileExists: boolean;
}
