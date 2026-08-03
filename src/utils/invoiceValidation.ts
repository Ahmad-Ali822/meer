import type {
  InvoiceFormErrors,
  InvoiceFormState,
  ProductRow,
} from "../types/invoice";
import { calculateInvoiceFromForm } from "./invoiceCalculations";
import {
  parsePercentageInput,
  parseQuantityInput,
  parseRupeesInput,
} from "./money";

const PHONE_PATTERN = /^[\d\s+\-()]{7,20}$/;

function createEmptyProductErrors(): InvoiceFormErrors["products"] {
  return {};
}

export function createEmptyInvoiceForm(): InvoiceFormState {
  return {
    customerName: "",
    phoneNumber: "",
    products: [createEmptyProductRow()],
    discountType: "none",
    discountValue: "",
    advancePayment: "",
  };
}

export function createEmptyProductRow(): ProductRow {
  return {
    id: crypto.randomUUID(),
    productName: "",
    quantity: "1",
    unitPrice: "",
  };
}

export function isInvoiceFormPopulated(form: InvoiceFormState): boolean {
  if (form.customerName.trim() || form.phoneNumber.trim()) {
    return true;
  }

  if (form.discountType !== "none") {
    return true;
  }

  if (parseRupeesInput(form.advancePayment) > 0) {
    return true;
  }

  if (form.products.length > 1) {
    return true;
  }

  return form.products.some((product) => {
    return (
      product.productName.trim().length > 0 ||
      parseRupeesInput(product.unitPrice) > 0 ||
      (product.quantity.trim() !== "" && product.quantity.trim() !== "1")
    );
  });
}

export function validateInvoiceForm(form: InvoiceFormState): InvoiceFormErrors {
  const errors: InvoiceFormErrors = {
    products: createEmptyProductErrors(),
  };

  if (!form.customerName.trim()) {
    errors.customerName = "Customer name is required.";
  }

  if (!form.phoneNumber.trim()) {
    errors.phoneNumber = "Phone number is required.";
  } else if (!PHONE_PATTERN.test(form.phoneNumber.trim())) {
    errors.phoneNumber = "Enter a valid phone number.";
  }

  form.products.forEach((product) => {
    const rowErrors: NonNullable<InvoiceFormErrors["products"][string]> = {};
    const quantity = parseQuantityInput(product.quantity);
    const unitPriceRupees = parseRupeesInput(product.unitPrice);
    const hasRowData =
      product.productName.trim().length > 0 ||
      unitPriceRupees > 0 ||
      quantity !== 1 ||
      product.quantity.trim() === "";

    if (hasRowData || form.products.length === 1) {
      if (!product.productName.trim()) {
        rowErrors.productName = "Product name is required.";
      }

      if (!product.quantity.trim()) {
        rowErrors.quantity = "Quantity is required.";
      } else if (quantity <= 0) {
        rowErrors.quantity = "Quantity must be greater than zero.";
      } else if (!Number.isInteger(quantity)) {
        rowErrors.quantity = "Quantity must be a whole number.";
      }

      if (!product.unitPrice.trim()) {
        rowErrors.unitPrice = "Unit price is required.";
      } else if (unitPriceRupees < 0) {
        rowErrors.unitPrice = "Unit price cannot be negative.";
      }
    }

    if (Object.keys(rowErrors).length > 0) {
      errors.products[product.id] = rowErrors;
    }
  });

  if (form.discountType === "fixed") {
    const discountValue = parseRupeesInput(form.discountValue);
    const { subtotalRupees } = calculateInvoiceFromForm({
      ...form,
      discountType: "none",
      discountValue: "",
    });

    if (!form.discountValue.trim()) {
      errors.discountValue = "Enter a discount amount.";
    } else if (discountValue <= 0) {
      errors.discountValue = "Discount must be greater than zero.";
    } else if (discountValue > subtotalRupees) {
      errors.discountValue = "Discount cannot exceed subtotal.";
    }
  }

  if (form.discountType === "percentage") {
    const discountValue = parsePercentageInput(form.discountValue);

    if (!form.discountValue.trim()) {
      errors.discountValue = "Enter a discount percentage.";
    } else if (discountValue <= 0) {
      errors.discountValue = "Percentage must be greater than zero.";
    } else if (discountValue > 100) {
      errors.discountValue = "Percentage cannot exceed 100.";
    }
  }

  const totals = calculateInvoiceFromForm(form);
  const advanceRupees = parseRupeesInput(form.advancePayment);

  if (form.advancePayment.trim() && advanceRupees > totals.grandTotalRupees) {
    errors.advancePayment = "Advance cannot exceed grand total.";
  }

  return errors;
}

export function hasInvoiceFormErrors(errors: InvoiceFormErrors): boolean {
  return (
    Boolean(errors.customerName) ||
    Boolean(errors.phoneNumber) ||
    Boolean(errors.discountValue) ||
    Boolean(errors.advancePayment) ||
    Object.keys(errors.products).length > 0
  );
}
