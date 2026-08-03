import { useCallback, useMemo, useState } from "react";
import type { DiscountType, InvoiceFormState } from "../types/invoice";
import type { LoadedEditableInvoice } from "../types/invoiceEdit";
import { calculateInvoiceFromForm } from "../utils/invoiceCalculations";
import {
  createEmptyInvoiceForm,
  createEmptyProductRow,
  isInvoiceFormPopulated,
  validateInvoiceForm,
  hasInvoiceFormErrors,
} from "../utils/invoiceValidation";

export function useInvoiceForm() {
  const [form, setForm] = useState<InvoiceFormState>(createEmptyInvoiceForm);
  const [showValidation, setShowValidation] = useState(false);

  const totals = useMemo(() => calculateInvoiceFromForm(form), [form]);
  const errors = useMemo(
    () => (showValidation ? validateInvoiceForm(form) : null),
    [form, showValidation],
  );
  const isDirty = useMemo(() => isInvoiceFormPopulated(form), [form]);

  const updateCustomerName = useCallback((customerName: string) => {
    setForm((current) => ({ ...current, customerName }));
  }, []);

  const updatePhoneNumber = useCallback((phoneNumber: string) => {
    setForm((current) => ({ ...current, phoneNumber }));
  }, []);

  const updateProduct = useCallback(
    (
      productId: string,
      field: "productName" | "quantity" | "unitPrice",
      value: string,
    ) => {
      setForm((current) => ({
        ...current,
        products: current.products.map((product) =>
          product.id === productId ? { ...product, [field]: value } : product,
        ),
      }));
    },
    [],
  );

  const addProductRow = useCallback(() => {
    setForm((current) => ({
      ...current,
      products: [...current.products, createEmptyProductRow()],
    }));
  }, []);

  const removeProductRow = useCallback((productId: string) => {
    setForm((current) => {
      if (current.products.length <= 1) {
        return current;
      }

      return {
        ...current,
        products: current.products.filter((product) => product.id !== productId),
      };
    });
  }, []);

  const setDiscountType = useCallback((discountType: DiscountType) => {
    setForm((current) => ({
      ...current,
      discountType,
      discountValue: discountType === "none" ? "" : current.discountValue,
    }));
  }, []);

  const updateDiscountValue = useCallback((discountValue: string) => {
    setForm((current) => ({ ...current, discountValue }));
  }, []);

  const updateAdvancePayment = useCallback((advancePayment: string) => {
    setForm((current) => ({ ...current, advancePayment }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(createEmptyInvoiceForm());
    setShowValidation(false);
  }, []);

  const loadEditableInvoice = useCallback((invoice: LoadedEditableInvoice) => {
    const hasDiscount = invoice.discount > 0;
    setForm({
      customerName: invoice.customerName,
      phoneNumber: invoice.phoneNumber,
      products:
        invoice.products.length > 0
          ? invoice.products.map((product) => ({
              id: crypto.randomUUID(),
              productName: product.name,
              quantity: String(product.quantity),
              unitPrice: String(product.unitPrice),
            }))
          : [createEmptyProductRow()],
      discountType: hasDiscount ? "fixed" : "none",
      discountValue: hasDiscount ? String(invoice.discount) : "",
      advancePayment: invoice.advance > 0 ? String(invoice.advance) : "",
    });
    setShowValidation(false);
  }, []);

  const enableValidation = useCallback(() => {
    setShowValidation(true);
  }, []);

  const touchValidation = enableValidation;

  const validateForPreview = useCallback(() => {
    setShowValidation(true);
    return !hasInvoiceFormErrors(validateInvoiceForm(form));
  }, [form]);

  return {
    form,
    totals,
    errors,
    isDirty,
    showValidation,
    updateCustomerName,
    updatePhoneNumber,
    updateProduct,
    addProductRow,
    removeProductRow,
    setDiscountType,
    updateDiscountValue,
    updateAdvancePayment,
    resetForm,
    loadEditableInvoice,
    touchValidation,
    validateForPreview,
  };
}
