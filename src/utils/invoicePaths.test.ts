import { describe, expect, it } from "vitest";
import {
  buildInvoicePdfFilename,
  sanitizeCustomerNameForFilename,
} from "./invoicePaths";

describe("sanitizeCustomerNameForFilename", () => {
  it("removes Windows-invalid characters and normalizes spaces", () => {
    expect(sanitizeCustomerNameForFilename("Ali/Raza*")).toBe("AliRaza");
    expect(sanitizeCustomerNameForFilename("  Ali   Raza  ")).toBe("Ali-Raza");
  });
});

describe("buildInvoicePdfFilename", () => {
  it("builds a safe PDF filename", () => {
    expect(
      buildInvoicePdfFilename("MI-2026-0001", "Ali Raza"),
    ).toBe("MI-2026-0001-Ali-Raza.pdf");
  });

  it("falls back to Customer when the name sanitizes to empty", () => {
    expect(buildInvoicePdfFilename("MI-2026-0002", "***")).toBe(
      "MI-2026-0002-Customer.pdf",
    );
  });
});
