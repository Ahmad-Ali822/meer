import {
  PLACEHOLDER_INVOICE_NUMBER,
  type InvoiceFormState,
} from "../types/invoice";

const PLACEHOLDER_USB_ROOT = "E:\\Meer Ilyas Invoices";

export function sanitizeCustomerNameForFilename(customerName: string): string {
  return customerName
    .trim()
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildPlaceholderFolderPath(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.toLocaleDateString("en-GB", { month: "long" });

  return `${PLACEHOLDER_USB_ROOT}\\${year}\\${month}`;
}

export function buildPlaceholderPdfPath(
  form: InvoiceFormState,
  date = new Date(),
): string {
  const folderPath = buildPlaceholderFolderPath(date);
  const customerSlug = sanitizeCustomerNameForFilename(form.customerName) || "Customer";

  return `${folderPath}\\${PLACEHOLDER_INVOICE_NUMBER}-${customerSlug}.pdf`;
}

export function buildPlaceholderPdfFilename(
  form: InvoiceFormState,
): string {
  const customerSlug = sanitizeCustomerNameForFilename(form.customerName) || "Customer";

  return `${PLACEHOLDER_INVOICE_NUMBER}-${customerSlug}.pdf`;
}
