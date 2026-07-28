import { invoke } from "@tauri-apps/api/core";
import type {
  SaveInvoicePdfRequest,
  SaveInvoicePdfResult,
} from "../types/invoiceSave";

export async function saveInvoicePdf(
  request: SaveInvoicePdfRequest,
): Promise<SaveInvoicePdfResult> {
  return invoke<SaveInvoicePdfResult>("save_invoice_pdf_command", { request });
}
