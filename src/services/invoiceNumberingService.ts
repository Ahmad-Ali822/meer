import { invoke } from "@tauri-apps/api/core";
import type {
  InvoiceSavePlan,
  ProposedInvoiceNumber,
} from "../types/invoiceNumbering";

export async function getProposedInvoiceNumber(): Promise<ProposedInvoiceNumber> {
  return invoke<ProposedInvoiceNumber>("get_proposed_invoice_number_command");
}

export async function resolveInvoiceSavePlan(
  customerName: string,
): Promise<InvoiceSavePlan> {
  return invoke<InvoiceSavePlan>("resolve_invoice_save_plan_command", {
    customerName,
  });
}

export async function finalizeInvoiceNumber(
  year: number,
  sequence: number,
): Promise<ProposedInvoiceNumber> {
  return invoke<ProposedInvoiceNumber>("finalize_invoice_number_command", {
    year,
    sequence,
  });
}
