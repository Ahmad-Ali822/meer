import { openPath } from "@tauri-apps/plugin-opener";

export async function openInvoicePdf(filePath: string): Promise<void> {
  const trimmedPath = filePath.trim();

  if (!trimmedPath) {
    throw new Error("The PDF file path is missing.");
  }

  if (!trimmedPath.toLowerCase().endsWith(".pdf")) {
    throw new Error("The saved file path is not a valid PDF.");
  }

  try {
    await openPath(trimmedPath);
  } catch {
    throw new Error(
      "Unable to open the PDF. The file may have been moved or the USB drive is unavailable.",
    );
  }
}
