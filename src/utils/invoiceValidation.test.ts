import { describe, expect, it } from "vitest";
import {
  createEmptyInvoiceForm,
  hasInvoiceFormErrors,
  isInvoiceFormPopulated,
  validateInvoiceForm,
} from "./invoiceValidation";

describe("invoiceValidation", () => {
  it("requires customer and product fields", () => {
    const errors = validateInvoiceForm(createEmptyInvoiceForm());

    expect(errors.customerName).toBeDefined();
    expect(errors.phoneNumber).toBeDefined();
    expect(hasInvoiceFormErrors(errors)).toBe(true);
  });

  it("detects populated forms", () => {
    const form = createEmptyInvoiceForm();
    expect(isInvoiceFormPopulated(form)).toBe(false);

    form.customerName = "Ali";
    expect(isInvoiceFormPopulated(form)).toBe(true);
  });

  it("rejects advance greater than grand total", () => {
    const form = createEmptyInvoiceForm();
    form.customerName = "Ali";
    form.phoneNumber = "+92 300 1234567";
    form.products[0].productName = "Plate";
    form.products[0].quantity = "1";
    form.products[0].unitPrice = "1000";
    form.advancePayment = "2000";

    const errors = validateInvoiceForm(form);
    expect(errors.advancePayment).toBeDefined();
  });
});
