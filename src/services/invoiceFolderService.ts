import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { InvoiceDirectoryStatus } from "../types/settings";

export async function getInvoiceDirectoryStatus(): Promise<InvoiceDirectoryStatus> {
  return invoke<InvoiceDirectoryStatus>("get_invoice_directory_status");
}

export async function saveSelectedInvoiceDirectory(
  path: string,
): Promise<InvoiceDirectoryStatus> {
  return invoke<InvoiceDirectoryStatus>("set_selected_invoice_directory", {
    path,
  });
}

export async function recheckInvoiceDirectory(): Promise<InvoiceDirectoryStatus> {
  return invoke<InvoiceDirectoryStatus>("recheck_invoice_directory");
}

export async function pickInvoiceDirectory(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: "Select USB Invoice Folder",
  });

  if (selected === null) {
    return null;
  }

  return typeof selected === "string" ? selected : null;
}
