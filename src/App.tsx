import { useCallback, useState } from "react";
import { HomeScreen } from "./screens/HomeScreen";
import { InvoiceFormScreen } from "./screens/InvoiceFormScreen";
import { InvoicePreviewScreen } from "./screens/InvoicePreviewScreen";
import { InvoiceSavedScreen } from "./screens/InvoiceSavedScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SplashScreen } from "./screens/SplashScreen";
import { useInvoiceForm } from "./hooks/useInvoiceForm";
import type { AppScreen } from "./types/navigation";
import {
  PLACEHOLDER_INVOICE_NUMBER,
  PLACEHOLDER_NEXT_INVOICE_NUMBER,
  type SavedInvoiceSummary,
} from "./types/invoice";
import { getAdvancePaidRupees } from "./utils/invoiceDisplay";
import { buildPlaceholderFolderPath, buildPlaceholderPdfPath } from "./utils/invoicePaths";

function App() {
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [savedSummary, setSavedSummary] = useState<SavedInvoiceSummary | null>(
    null,
  );
  const invoiceForm = useInvoiceForm();

  const goToLogin = useCallback(() => {
    setScreen("login");
  }, []);

  const goToHome = useCallback(() => {
    setScreen("home");
  }, []);

  const goToInvoice = useCallback(() => {
    setScreen("invoice");
  }, []);

  const goToPreview = useCallback(() => {
    setScreen("preview");
  }, []);

  const handlePreviewRequest = useCallback(() => {
    if (invoiceForm.validateForPreview()) {
      goToPreview();
    }
  }, [invoiceForm, goToPreview]);

  const handleSimulatedSave = useCallback(() => {
    const { form, totals } = invoiceForm;

    setSavedSummary({
      invoiceNumber: PLACEHOLDER_INVOICE_NUMBER,
      customerName: form.customerName.trim(),
      grandTotalRupees: totals.grandTotalRupees,
      advanceRupees: getAdvancePaidRupees(form),
      pendingRupees: totals.pendingRupees,
      folderPath: buildPlaceholderFolderPath(),
      filePath: buildPlaceholderPdfPath(form),
      nextInvoiceNumber: PLACEHOLDER_NEXT_INVOICE_NUMBER,
    });
    setScreen("saved");
  }, [invoiceForm]);

  const handleCreateNewInvoice = useCallback(() => {
    invoiceForm.clearForm();
    setSavedSummary(null);
    setScreen("invoice");
  }, [invoiceForm]);

  const handleLogout = useCallback(() => {
    setScreen("login");
  }, []);

  if (screen === "splash") {
    return <SplashScreen onComplete={goToLogin} />;
  }

  if (screen === "login") {
    return <LoginScreen onLoginSuccess={goToHome} />;
  }

  if (screen === "invoice") {
    return (
      <InvoiceFormScreen
        invoiceForm={invoiceForm}
        onHome={goToHome}
        onPreview={handlePreviewRequest}
      />
    );
  }

  if (screen === "preview") {
    return (
      <InvoicePreviewScreen
        form={invoiceForm.form}
        totals={invoiceForm.totals}
        onBackToEdit={goToInvoice}
        onGenerateSave={handleSimulatedSave}
      />
    );
  }

  if (screen === "saved" && savedSummary) {
    return (
      <InvoiceSavedScreen
        summary={savedSummary}
        onCreateNewInvoice={handleCreateNewInvoice}
        onHome={goToHome}
      />
    );
  }

  return (
    <HomeScreen onLogout={handleLogout} onCreateInvoice={goToInvoice} />
  );
}

export default App;
