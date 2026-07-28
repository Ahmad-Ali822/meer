import type { InvoiceFormState } from "../types/invoice";

export function sanitizeCustomerNameForFilename(customerName: string): string {
  return customerName
    .trim()
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildInvoicePdfFilename(
  invoiceNumber: string,
  customerName: string,
): string {
  const customerSlug =
    sanitizeCustomerNameForFilename(customerName) || "Customer";

  return `${invoiceNumber}-${customerSlug}.pdf`;
}

export function buildInvoiceFolderPath(
  invoiceRoot: string,
  date = new Date(),
): string {
  const year = date.getFullYear();
  const month = date.toLocaleDateString("en-GB", { month: "long" });

  return `${invoiceRoot}\\${year}\\${month}`;
}

export function buildInvoicePdfPath(
  invoiceRoot: string,
  invoiceNumber: string,
  form: Pick<InvoiceFormState, "customerName">,
  date = new Date(),
): string {
  const folderPath = buildInvoiceFolderPath(invoiceRoot, date);
  const fileName = buildInvoicePdfFilename(invoiceNumber, form.customerName);

  return `${folderPath}\\${fileName}`;
}
