import { useCallback, useEffect, useState } from "react";
import {
  getProposedInvoiceNumber,
  resolveInvoiceSavePlan,
} from "../services/invoiceNumberingService";
import type {
  InvoiceSavePlan,
  ProposedInvoiceNumber,
} from "../types/invoiceNumbering";

export function useInvoiceNumbering(
  invoiceDirectoryPath: string | null,
  customerName: string,
) {
  const [proposal, setProposal] = useState<ProposedInvoiceNumber | null>(null);
  const [savePlan, setSavePlan] = useState<InvoiceSavePlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProposal = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextProposal = await getProposedInvoiceNumber();
      setProposal(nextProposal);
      return nextProposal;
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to determine the next invoice number.";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSavePlan = useCallback(async () => {
    if (!invoiceDirectoryPath) {
      setSavePlan(null);
      return null;
    }

    try {
      const nextSavePlan = await resolveInvoiceSavePlan(customerName);
      setSavePlan(nextSavePlan);
      return nextSavePlan;
    } catch (planError) {
      const message =
        planError instanceof Error
          ? planError.message
          : "Unable to resolve the invoice filename.";
      setError(message);
      setSavePlan(null);
      return null;
    }
  }, [customerName, invoiceDirectoryPath]);

  useEffect(() => {
    void refreshProposal();
  }, [invoiceDirectoryPath, refreshProposal]);

  useEffect(() => {
    if (!invoiceDirectoryPath) {
      setSavePlan(null);
      return;
    }

    void refreshSavePlan();
  }, [customerName, invoiceDirectoryPath, refreshSavePlan]);

  const displayedInvoiceNumber =
    savePlan?.invoiceNumber ?? proposal?.invoiceNumber ?? null;

  return {
    proposal,
    savePlan,
    displayedInvoiceNumber,
    isLoading,
    error,
    refreshProposal,
    refreshSavePlan,
  };
}
