import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type {
  LoadedEditableInvoice,
  UpdateSavedInvoiceRequest,
} from "../types/invoiceEdit";
import type { SaveInvoicePdfResult } from "../types/invoiceSave";

export async function ensureSharedInvoiceJsonDir(): Promise<string | null> {
  try {
    return await invoke<string>("ensure_invoice_json_dir_command");
  } catch {
    return null;
  }
}

export async function pickEditableInvoiceFile(
  invoiceRoot: string | null,
): Promise<string | null> {
  const ensuredJsonDir = await ensureSharedInvoiceJsonDir();
  const defaultPath =
    ensuredJsonDir ??
    (invoiceRoot ? `${invoiceRoot.replace(/[\\/]+$/, "")}\\json` : undefined);

  const selected = await open({
    multiple: false,
    directory: false,
    title: "Select Saved Invoice",
    defaultPath: defaultPath ?? undefined,
    filters: [
      {
        name: "Editable Invoice",
        extensions: ["invoice.json"],
      },
    ],
  });

  if (selected === null) {
    return null;
  }

  return typeof selected === "string" ? selected : null;
}

export async function loadEditableInvoice(
  path: string,
): Promise<LoadedEditableInvoice> {
  return invoke<LoadedEditableInvoice>("load_editable_invoice_command", {
    path,
  });
}

export async function updateSavedInvoice(
  request: UpdateSavedInvoiceRequest,
): Promise<SaveInvoicePdfResult> {
  return invoke<SaveInvoicePdfResult>("update_saved_invoice_command", {
    request,
  });
}
