import { useCallback, useEffect, useState } from "react";
import {
  getInvoiceDirectoryStatus,
  openInvoiceDirectory,
  pickInvoiceDirectory,
  recheckInvoiceDirectory,
  saveSelectedInvoiceDirectory,
} from "../services/invoiceFolderService";
import type { InvoiceDirectoryStatus } from "../types/settings";

const EMPTY_STATUS: InvoiceDirectoryStatus = {
  path: null,
  isAvailable: false,
};

export function useInvoiceFolder() {
  const [status, setStatus] = useState<InvoiceDirectoryStatus>(EMPTY_STATUS);
  const [isLoading, setIsLoading] = useState(true);
  const [showUsbWarning, setShowUsbWarning] = useState(false);

  const applyStatus = useCallback((next: InvoiceDirectoryStatus) => {
    setStatus(next);

    if (next.path && !next.isAvailable) {
      setShowUsbWarning(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      setIsLoading(true);

      try {
        const next = await getInvoiceDirectoryStatus();

        if (!cancelled) {
          applyStatus(next);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [applyStatus]);

  const selectFolder = useCallback(async () => {
    const pickedPath = await pickInvoiceDirectory();

    if (!pickedPath) {
      return;
    }

    const next = await saveSelectedInvoiceDirectory(pickedPath);
    applyStatus(next);

    if (next.isAvailable) {
      setShowUsbWarning(false);
    }
  }, [applyStatus]);

  const tryAgain = useCallback(async () => {
    const next = await recheckInvoiceDirectory();
    setStatus(next);

    if (next.isAvailable) {
      setShowUsbWarning(false);
    }
  }, []);

  const openFolder = useCallback(async () => {
    if (!status.path) {
      return;
    }

    if (!status.isAvailable) {
      setShowUsbWarning(true);
      return;
    }

    await openInvoiceDirectory(status.path);
  }, [status]);

  const selectAnotherFolder = useCallback(async () => {
    setShowUsbWarning(false);
    await selectFolder();
  }, [selectFolder]);

  const dismissUsbWarning = useCallback(() => {
    setShowUsbWarning(false);
  }, []);

  return {
    status,
    isLoading,
    showUsbWarning,
    selectFolder,
    tryAgain,
    openFolder,
    selectAnotherFolder,
    dismissUsbWarning,
  };
}
