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
import {
  loadEditableInvoice,
  pickEditableInvoiceFile,
  updateSavedInvoice,
} from "./services/invoiceEditService";
import { saveInvoicePdf } from "./services/invoiceSaveService";
import type { InvoiceEditSession } from "./types/invoiceEdit";
import type { AppScreen } from "./types/navigation";
import type { SavedInvoiceSummary } from "./types/invoice";
import { isSaveInvoicePdfError } from "./types/invoiceSave";
import { parseInvoiceDateIso } from "./utils/invoiceDisplay";
import {
  buildSaveInvoicePdfRequest,
  buildUpdateSavedInvoiceRequest,
} from "./utils/invoiceSave";

function App() {
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showSaveUsbWarning, setShowSaveUsbWarning] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [editSession, setEditSession] = useState<InvoiceEditSession | null>(
    null,
  );
  const [savedSummary, setSavedSummary] = useState<SavedInvoiceSummary | null>(
    null,
  );
  const isSavingRef = useRef(false);
  const isLoadingEditRef = useRef(false);
  const invoiceForm = useInvoiceForm();
  const invoiceFolder = useInvoiceFolder();
  const invoiceNumbering = useInvoiceNumbering(
    editSession ? null : invoiceFolder.status.path,
    editSession ? "" : invoiceForm.form.customerName,
  );

  const invoiceMode = editSession ? "edit" : "new";

  const clearEditSession = useCallback(() => {
    setEditSession(null);
    setEditErrorMessage(null);
  }, []);

  const resetInvoice = useCallback(() => {
    invoiceForm.resetForm();
    invoiceNumbering.clearDraftPlan();
    clearEditSession();
    setSaveErrorMessage(null);
    setShowSaveUsbWarning(false);
    setIsPreviewLoading(false);
    setSavedSummary(null);
  }, [clearEditSession, invoiceForm, invoiceNumbering]);

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
      if (invoiceMode === "new") {
        await invoiceNumbering.refreshSavePlan();
      }
      setScreen("preview");
    } finally {
      setIsPreviewLoading(false);
    }
  }, [invoiceForm, invoiceMode, invoiceNumbering, isPreviewLoading]);

  const handleSaveInvoice = useCallback(async () => {
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveErrorMessage(null);

    try {
      if (invoiceMode === "edit" && editSession) {
        const payload = buildUpdateSavedInvoiceRequest(
          editSession.jsonPath,
          invoiceForm.form,
          invoiceForm.totals,
        );
        const result = await updateSavedInvoice(payload);

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

        resetInvoice();
        setSavedSummary(summary);
        void invoiceNumbering.refreshProposal();
        setScreen("saved");
        return;
      }

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
        : invoiceMode === "edit"
          ? "Unable to save invoice changes. Please try again."
          : "Unable to save the invoice PDF. Please try again.";
      setSaveErrorMessage(message);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [
    editSession,
    invoiceForm,
    invoiceMode,
    invoiceNumbering,
    resetInvoice,
  ]);

  const handleEditSavedInvoice = useCallback(async () => {
    if (isLoadingEditRef.current || isSavingRef.current) {
      return;
    }

    isLoadingEditRef.current = true;
    setIsLoadingEdit(true);
    setEditErrorMessage(null);

    try {
      const selectedPath = await pickEditableInvoiceFile(
        invoiceFolder.status.path,
      );
      if (!selectedPath) {
        return;
      }

      const loaded = await loadEditableInvoice(selectedPath);
      invoiceForm.loadEditableInvoice(loaded);
      invoiceNumbering.clearDraftPlan();
      setEditSession({
        mode: "edit",
        invoiceNumber: loaded.invoiceNumber,
        invoiceDateIso: loaded.date,
        jsonPath: loaded.jsonPath,
        pdfPath: loaded.pdfPath,
        folderPath: loaded.folderPath,
        fileName: loaded.fileName,
      });
      setSaveErrorMessage(null);
      setSavedSummary(null);
      setScreen("invoice");
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unable to open the selected invoice.";
      setEditErrorMessage(message);
    } finally {
      isLoadingEditRef.current = false;
      setIsLoadingEdit(false);
    }
  }, [invoiceFolder.status.path, invoiceForm, invoiceNumbering]);

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

  const displayedInvoiceNumber =
    invoiceMode === "edit" && editSession
      ? editSession.invoiceNumber
      : invoiceNumbering.displayedInvoiceNumber;

  const invoiceDate =
    invoiceMode === "edit" && editSession
      ? parseInvoiceDateIso(editSession.invoiceDateIso)
      : new Date();

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
        mode={invoiceMode}
        invoiceNumber={displayedInvoiceNumber}
        invoiceNumberLoading={
          invoiceMode === "new" ? invoiceNumbering.isLoading : false
        }
        invoiceDate={invoiceDate}
        isPreviewLoading={isPreviewLoading}
        onResetInvoice={
          invoiceMode === "edit" ? discardInvoiceAndGoHome : resetInvoice
        }
        onDiscardAndHome={discardInvoiceAndGoHome}
        onCancelEditing={discardInvoiceAndGoHome}
        onPreview={handlePreviewRequest}
      />
    );
  }

  if (screen === "preview") {
    const editSavePlan =
      invoiceMode === "edit" && editSession
        ? {
            invoiceNumber: editSession.invoiceNumber,
            nextInvoiceNumber: editSession.invoiceNumber,
            year: 0,
            sequence: 0,
            folderPath: editSession.folderPath,
            fileName: editSession.fileName,
            filePath: editSession.pdfPath,
            fileExists: false,
          }
        : null;

    return (
      <>
        <InvoicePreviewScreen
          form={invoiceForm.form}
          totals={invoiceForm.totals}
          invoiceNumber={displayedInvoiceNumber}
          invoiceDate={invoiceDate}
          savePlan={
            invoiceMode === "edit" ? editSavePlan : invoiceNumbering.savePlan
          }
          mode={invoiceMode}
          isSaving={isSaving}
          saveErrorMessage={saveErrorMessage}
          onBackToEdit={returnToInvoiceEdit}
          onCancelEditing={discardInvoiceAndGoHome}
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
        onEditSavedInvoice={() => void handleEditSavedInvoice()}
        isLoadingEdit={isLoadingEdit}
        editErrorMessage={editErrorMessage}
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
