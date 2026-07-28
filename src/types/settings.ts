export interface AppSettings {
  selectedInvoiceDirectory: string | null;
  year: number;
  lastSuccessfulSequence: number;
}

export interface InvoiceDirectoryStatus {
  path: string | null;
  isAvailable: boolean;
}
