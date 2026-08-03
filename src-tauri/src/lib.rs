mod auth;
mod invoice_data;
mod invoice_folder;
mod invoice_numbering;
mod invoice_pdf;
mod settings;

use invoice_data::{
    ensure_shared_json_dir, load_editable_invoice, LoadedEditableInvoice,
    UpdateSavedInvoiceRequest,
};
use invoice_numbering::{
    finalize_invoice_sequence, get_proposed_invoice_number, reset_invoice_sequence_counter,
    resolve_invoice_save_plan, InvoiceSavePlan, ProposedInvoiceNumber,
};
use invoice_pdf::{
    save_invoice_pdf, update_saved_invoice, SaveInvoicePdfError, SaveInvoicePdfRequest,
    SaveInvoicePdfResult,
};
use settings::{load_settings, save_settings, AppSettings};
use tauri::{AppHandle, Manager};

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct InvoiceDirectoryStatus {
    path: Option<String>,
    is_available: bool,
}

fn build_directory_status(settings: &AppSettings) -> InvoiceDirectoryStatus {
    let path = settings.selected_invoice_directory.clone();
    let is_available = path
        .as_ref()
        .map(|directory| invoice_folder::is_directory_available(directory))
        .unwrap_or(false);

    InvoiceDirectoryStatus { path, is_available }
}

#[tauri::command]
fn verify_login(username: String, password: String) -> Result<bool, String> {
    auth::login(username, password)
}

#[tauri::command]
fn get_invoice_directory_status(app: AppHandle) -> Result<InvoiceDirectoryStatus, String> {
    let settings = load_settings(&app)?;
    Ok(build_directory_status(&settings))
}

#[tauri::command]
fn set_selected_invoice_directory(
    app: AppHandle,
    path: String,
) -> Result<InvoiceDirectoryStatus, String> {
    let trimmed_path = path.trim();

    if trimmed_path.is_empty() {
        return Err("Folder path cannot be empty.".to_string());
    }

    let mut settings = load_settings(&app)?;
    settings.selected_invoice_directory = Some(trimmed_path.to_string());
    save_settings(&app, &settings)?;

    Ok(build_directory_status(&settings))
}

#[tauri::command]
fn recheck_invoice_directory(app: AppHandle) -> Result<InvoiceDirectoryStatus, String> {
    get_invoice_directory_status(app)
}

#[tauri::command]
fn get_proposed_invoice_number_command(app: AppHandle) -> Result<ProposedInvoiceNumber, String> {
    let settings = load_settings(&app)?;
    get_proposed_invoice_number(&settings)
}

#[tauri::command]
fn resolve_invoice_save_plan_command(
    app: AppHandle,
    customer_name: String,
) -> Result<InvoiceSavePlan, String> {
    let settings = load_settings(&app)?;
    resolve_invoice_save_plan(&settings, &customer_name)
}

#[tauri::command]
fn finalize_invoice_number_command(
    app: AppHandle,
    year: i32,
    sequence: u32,
) -> Result<ProposedInvoiceNumber, String> {
    finalize_invoice_sequence(&app, year, sequence)
}

#[tauri::command]
fn save_invoice_pdf_command(
    app: AppHandle,
    request: SaveInvoicePdfRequest,
) -> Result<SaveInvoicePdfResult, SaveInvoicePdfError> {
    save_invoice_pdf(&app, &request)
}

#[tauri::command]
fn load_editable_invoice_command(path: String) -> Result<LoadedEditableInvoice, String> {
    load_editable_invoice(&path)
}

#[tauri::command]
fn ensure_invoice_json_dir_command(app: AppHandle) -> Result<String, String> {
    let settings = load_settings(&app)?;
    let invoice_root = settings
        .selected_invoice_directory
        .as_deref()
        .ok_or_else(|| "No invoice folder selected.".to_string())?;

    if !invoice_folder::is_directory_available(invoice_root) {
        return Err("The selected invoice folder is not available.".to_string());
    }

    let json_dir = ensure_shared_json_dir(std::path::Path::new(invoice_root))?;
    Ok(json_dir.to_string_lossy().into_owned())
}

#[tauri::command]
fn update_saved_invoice_command(
    request: UpdateSavedInvoiceRequest,
) -> Result<SaveInvoicePdfResult, SaveInvoicePdfError> {
    update_saved_invoice(&request)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // One-time counter wipe so numbering restarts at MI-YYYY-0001.
            if let Ok(marker) = app.path().resolve(
                "invoice-sequence-reset-v1.flag",
                tauri::path::BaseDirectory::AppConfig,
            ) {
                if !marker.exists() {
                    let _ = reset_invoice_sequence_counter(app.handle());
                    if let Some(parent) = marker.parent() {
                        let _ = std::fs::create_dir_all(parent);
                    }
                    let _ = std::fs::write(&marker, b"done");
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            verify_login,
            get_invoice_directory_status,
            set_selected_invoice_directory,
            recheck_invoice_directory,
            get_proposed_invoice_number_command,
            resolve_invoice_save_plan_command,
            finalize_invoice_number_command,
            save_invoice_pdf_command,
            load_editable_invoice_command,
            ensure_invoice_json_dir_command,
            update_saved_invoice_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
