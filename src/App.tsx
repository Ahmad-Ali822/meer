import { useCallback, useRef, useState } from "react";
import { LogoutDialog } from "./components/invoice/LogoutDialog";
import { UsbUnavailableDialog } from "./components/invoice/UsbUnavailableDialog";
import { HomeScreen } from "./screens/HomeScreen";
import { InvoiceFormScreen } from "./screens/InvoiceFormScreen";
import { InvoicePreviewScreen } from "./screens/InvoicePreviewScreen";
import { InvoiceSavedScreen } from "./screens/InvoiceSavedScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SplashScreen } from "./screens/SplashScreen";
import { useInvoiceFolder } from "./hooks/useInvoiceFolder";
import { useInvoiceForm } from "./hooks/useInvoiceForm";
import { useInvoiceNumbering } from "./hooks/useInvoiceNumbering";
import { saveInvoicePdf } from "./services/invoiceSaveService";
import type { AppScreen } from "./types/navigation";
import type { SavedInvoiceSummary } from "./types/invoice";
import { isSaveInvoicePdfError } from "./types/invoiceSave";
import { buildSaveInvoicePdfRequest } from "./utils/invoiceSave";

function App() {
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showSaveUsbWarning, setShowSaveUsbWarning] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [savedSummary, setSavedSummary] = useState<SavedInvoiceSummary | null>(
    null,
  );
  const isSavingRef = useRef(false);
  const invoiceForm = useInvoiceForm();
  const invoiceFolder = useInvoiceFolder();
  const invoiceNumbering = useInvoiceNumbering(
    invoiceFolder.status.path,
    invoiceForm.form.customerName,
  );

  const resetInvoice = useCallback(() => {
    invoiceForm.resetForm();
    invoiceNumbering.clearDraftPlan();
    setSaveErrorMessage(null);
    setShowSaveUsbWarning(false);
    setIsPreviewLoading(false);
    setSavedSummary(null);
  }, [invoiceForm, invoiceNumbering]);

  const goToLogin = useCallback(() => {
    setScreen("login");
  }, []);

  const goToHome = useCallback(() => {
    setScreen("home");
  }, []);

  const startFreshInvoice = useCallback(() => {
    resetInvoice();
    void invoiceNumbering.refreshProposal();
    setScreen("invoice");
  }, [invoiceNumbering, resetInvoice]);

  const returnToInvoiceEdit = useCallback(() => {
    setSaveErrorMessage(null);
    setScreen("invoice");
  }, []);

  const discardInvoiceAndGoHome = useCallback(() => {
    resetInvoice();
    void invoiceNumbering.refreshProposal();
    goToHome();
  }, [goToHome, invoiceNumbering, resetInvoice]);

  const handlePreviewRequest = useCallback(async () => {
    if (isPreviewLoading || isSavingRef.current) {
      return;
    }

    if (!invoiceForm.validateForPreview()) {
      return;
    }

    setIsPreviewLoading(true);
    setSaveErrorMessage(null);

    try {
      await invoiceNumbering.refreshSavePlan();
      setScreen("preview");
    } finally {
      setIsPreviewLoading(false);
    }
  }, [invoiceForm, invoiceNumbering, isPreviewLoading]);

  const handleSaveInvoice = useCallback(async () => {
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveErrorMessage(null);

    try {
      const savePlan =
        invoiceNumbering.savePlan ??
        (await invoiceNumbering.refreshSavePlan());

      if (!savePlan) {
        setShowSaveUsbWarning(true);
        return;
      }

      const payload = buildSaveInvoicePdfRequest(
        invoiceForm.form,
        invoiceForm.totals,
      );
      const result = await saveInvoicePdf(payload);

      const summary: SavedInvoiceSummary = {
        invoiceNumber: result.invoiceNumber,
        customerName: result.customerName,
        grandTotalRupees: result.grandTotalRupees,
        advanceRupees: result.advanceRupees,
        pendingRupees: result.pendingRupees,
        folderPath: result.folderPath,
        filePath: result.filePath,
        nextInvoiceNumber: result.nextInvoiceNumber,
      };

      // Counter is persisted by Rust only after a successful PDF write.
      // Clear the draft, then keep the summary for the Success screen.
      resetInvoice();
      setSavedSummary(summary);
      void invoiceNumbering.refreshProposal();
      setScreen("saved");
    } catch (error) {
      if (isSaveInvoicePdfError(error) && error.code === "usb_unavailable") {
        setShowSaveUsbWarning(true);
        return;
      }

      const message = isSaveInvoicePdfError(error)
        ? error.message
        : "Unable to save the invoice PDF. Please try again.";
      setSaveErrorMessage(message);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [invoiceForm, invoiceNumbering, resetInvoice]);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
    setScreen("home");
  }, []);

  const performLogout = useCallback(() => {
    setIsAuthenticated(false);
    setShowLogoutDialog(false);
    resetInvoice();
    setScreen("login");
  }, [resetInvoice]);

  const handleLogoutRequest = useCallback(() => {
    if (invoiceForm.isDirty || screen === "preview" || screen === "saved") {
      setShowLogoutDialog(true);
      return;
    }

    performLogout();
  }, [invoiceForm.isDirty, performLogout, screen]);

  if (screen === "splash") {
    return <SplashScreen onComplete={goToLogin} />;
  }

  if (screen === "login") {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (screen === "invoice") {
    return (
      <InvoiceFormScreen
        invoiceForm={invoiceForm}
        invoiceNumber={invoiceNumbering.displayedInvoiceNumber}
        invoiceNumberLoading={invoiceNumbering.isLoading}
        isPreviewLoading={isPreviewLoading}
        onResetInvoice={resetInvoice}
        onDiscardAndHome={discardInvoiceAndGoHome}
        onPreview={handlePreviewRequest}
      />
    );
  }

  if (screen === "preview") {
    return (
      <>
        <InvoicePreviewScreen
          form={invoiceForm.form}
          totals={invoiceForm.totals}
          invoiceNumber={invoiceNumbering.displayedInvoiceNumber}
          savePlan={invoiceNumbering.savePlan}
          isSaving={isSaving}
          saveErrorMessage={saveErrorMessage}
          onBackToEdit={returnToInvoiceEdit}
          onGenerateSave={() => void handleSaveInvoice()}
        />
        <UsbUnavailableDialog
          open={showSaveUsbWarning}
          folderPath={invoiceFolder.status.path}
          onTryAgain={() => {
            void invoiceFolder.tryAgain().then(() => {
              void invoiceNumbering.refreshSavePlan();
            });
          }}
          onSelectAnother={() => {
            void invoiceFolder.selectAnotherFolder().then(() => {
              void invoiceNumbering.refreshSavePlan();
            });
          }}
          onClose={() => setShowSaveUsbWarning(false)}
        />
      </>
    );
  }

  if (screen === "saved" && savedSummary) {
    return (
      <InvoiceSavedScreen
        summary={savedSummary}
        onCreateNewInvoice={startFreshInvoice}
        onHome={discardInvoiceAndGoHome}
      />
    );
  }

  return (
    <>
      <HomeScreen
        invoiceFolder={invoiceFolder}
        onLogout={handleLogoutRequest}
        onCreateInvoice={startFreshInvoice}
      />
      <LogoutDialog
        open={showLogoutDialog}
        onStay={() => setShowLogoutDialog(false)}
        onLogout={performLogout}
      />
    </>
  );
}

export default App;
