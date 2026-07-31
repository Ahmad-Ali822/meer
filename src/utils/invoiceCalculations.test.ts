import { describe, expect, it } from "vitest";
import {
  buildCalculationInput,
  calculateInvoiceFromForm,
  calculateInvoiceTotals,
} from "./invoiceCalculations";
import type { InvoiceFormState } from "../types/invoice";

function createForm(overrides: Partial<InvoiceFormState> = {}): InvoiceFormState {
  return {
    customerName: "Ali Raza",
    phoneNumber: "+92 300 1234567",
    products: [
      {
        id: "1",
        productName: "Plate Set",
        quantity: "2",
        unitPrice: "1500",
      },
    ],
    discountType: "none",
    discountValue: "",
    advancePayment: "",
    ...overrides,
  };
}

describe("calculateInvoiceTotals", () => {
  it("calculates line totals and subtotal in whole rupees", () => {
    const totals = calculateInvoiceTotals({
      lines: [{ quantity: 2, unitPriceRupees: 1500 }],
      discountType: "none",
      discountValue: 0,
      advanceRupees: 0,
    });

    expect(totals.lineTotalsRupees).toEqual([3000]);
    expect(totals.subtotalRupees).toBe(3000);
    expect(totals.grandTotalRupees).toBe(3000);
    expect(totals.pendingRupees).toBe(3000);
  });

  it("applies fixed discount without exceeding subtotal", () => {
    const totals = calculateInvoiceTotals({
      lines: [{ quantity: 1, unitPriceRupees: 5000 }],
      discountType: "fixed",
      discountValue: 500,
      advanceRupees: 0,
    });

    expect(totals.discountAmountRupees).toBe(500);
    expect(totals.grandTotalRupees).toBe(4500);
  });

  it("caps advance at grand total and calculates pending", () => {
    const totals = calculateInvoiceTotals({
      lines: [{ quantity: 1, unitPriceRupees: 4000 }],
      discountType: "none",
      discountValue: 0,
      advanceRupees: 5000,
    });

    expect(totals.grandTotalRupees).toBe(4000);
    expect(totals.pendingRupees).toBe(0);
  });
});

describe("calculateInvoiceFromForm", () => {
  it("uses the shared form calculation path", () => {
    const form = createForm({
      discountType: "percentage",
      discountValue: "10",
      advancePayment: "1000",
    });

    const totals = calculateInvoiceFromForm(form);
    const input = buildCalculationInput(form);

    expect(totals).toEqual(calculateInvoiceTotals(input));
    expect(totals.discountAmountRupees).toBe(300);
    expect(totals.pendingRupees).toBe(1700);
  });
});
