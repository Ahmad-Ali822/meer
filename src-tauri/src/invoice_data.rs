use std::fs;
use std::path::{Component, Path, PathBuf};

use chrono::{Datelike, NaiveDate};
use serde::{Deserialize, Serialize};

use crate::invoice_numbering::parse_invoice_number;

const SCHEMA_VERSION: u32 = 1;
const MAX_JSON_BYTES: u64 = 1024 * 1024;
const MAX_CUSTOMER_NAME_CHARS: usize = 120;
const MAX_PHONE_CHARS: usize = 20;
const MAX_PRODUCT_NAME_CHARS: usize = 200;
const MAX_PRODUCTS: usize = 100;
pub const EDITABLE_SUFFIX: &str = ".invoice.json";
pub const SHARED_JSON_DIR_NAME: &str = "json";
const BACKUPS_DIR_NAME: &str = "Backups";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditableInvoiceProduct {
    pub name: String,
    pub quantity: i64,
    pub unit_price: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditableInvoiceCustomer {
    pub name: String,
    pub phone: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditableInvoiceData {
    pub schema_version: u32,
    pub invoice_number: String,
    pub date: String,
    pub customer: EditableInvoiceCustomer,
    pub products: Vec<EditableInvoiceProduct>,
    pub discount: i64,
    pub advance: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSavedInvoiceRequest {
    pub editable_json_path: String,
    pub customer_name: String,
    pub phone_number: String,
    pub products: Vec<UpdateSavedInvoiceProduct>,
    pub discount_rupees: i64,
    pub advance_rupees: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSavedInvoiceProduct {
    pub name: String,
    pub quantity: i64,
    pub unit_price_rupees: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadedEditableInvoice {
    pub invoice_number: String,
    pub date: String,
    pub customer_name: String,
    pub phone_number: String,
    pub products: Vec<EditableInvoiceProduct>,
    pub discount: i64,
    pub advance: i64,
    pub json_path: String,
    pub pdf_path: String,
    pub folder_path: String,
    pub file_name: String,
}

#[derive(Debug, Clone)]
pub struct CalculatedInvoiceTotals {
    pub line_totals_rupees: Vec<i64>,
    pub subtotal_rupees: i64,
    pub discount_amount_rupees: i64,
    pub grand_total_rupees: i64,
    pub advance_rupees: i64,
    pub pending_rupees: i64,
}

pub fn missing_editable_data_message() -> &'static str {
    "This invoice cannot be edited because its editable data file is missing."
}

/// Join `base` with a relative path segment, rejecting traversal and absolute inputs.
pub fn safe_join(base: &Path, relative: &str) -> Result<PathBuf, String> {
    let trimmed = relative.trim();
    if trimmed.is_empty() {
        return Err("Path segment cannot be empty.".to_string());
    }
    if trimmed.contains('\0') {
        return Err("Path segment is invalid.".to_string());
    }

    let relative_path = Path::new(trimmed);
    if relative_path.is_absolute() {
        return Err("Path segment must be relative.".to_string());
    }

    for component in relative_path.components() {
        match component {
            Component::Normal(value) => {
                let text = value.to_string_lossy();
                if text == ".." || text.contains('/') || text.contains('\\') {
                    return Err("Path segment must not contain traversal.".to_string());
                }
            }
            Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err("Path segment must not contain traversal.".to_string());
            }
        }
    }

    Ok(base.join(relative_path))
}

pub fn shared_json_dir(invoice_root: &Path) -> Result<PathBuf, String> {
    reject_unsafe_path(invoice_root)?;
    safe_join(invoice_root, SHARED_JSON_DIR_NAME)
}

pub fn ensure_shared_json_dir(invoice_root: &Path) -> Result<PathBuf, String> {
    let dir = shared_json_dir(invoice_root)?;
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir)
}

pub fn backups_dir(invoice_root: &Path) -> Result<PathBuf, String> {
    reject_unsafe_path(invoice_root)?;
    safe_join(invoice_root, BACKUPS_DIR_NAME)
}

fn pdf_stem(pdf_path: &Path) -> Result<String, String> {
    let file_name = pdf_path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "Invalid PDF path.".to_string())?;

    let stem = file_name
        .strip_suffix(".pdf")
        .or_else(|| file_name.strip_suffix(".PDF"))
        .unwrap_or(file_name);

    if stem.is_empty() || stem.contains('/') || stem.contains('\\') || stem.contains("..") {
        return Err("Invalid PDF filename.".to_string());
    }

    Ok(stem.to_string())
}

fn invoice_json_file_name(stem: &str) -> Result<String, String> {
    if stem.is_empty() || stem.contains('/') || stem.contains('\\') || stem.contains("..") {
        return Err("Invalid invoice filename stem.".to_string());
    }
    Ok(format!("{stem}{EDITABLE_SUFFIX}"))
}

/// Preferred path for new/edited JSON: `{invoice_root}/json/{stem}.invoice.json`.
pub fn editable_json_path_in_shared_folder(
    invoice_root: &Path,
    pdf_path: &Path,
) -> Result<PathBuf, String> {
    let stem = pdf_stem(pdf_path)?;
    let json_dir = ensure_shared_json_dir(invoice_root)?;
    let file_name = invoice_json_file_name(&stem)?;
    Ok(json_dir.join(file_name))
}

/// Legacy beside-PDF location, kept for older invoices.
pub fn editable_json_path_beside_pdf(pdf_path: &Path) -> PathBuf {
    let file_name = pdf_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("invoice.pdf");

    let stem = file_name
        .strip_suffix(".pdf")
        .or_else(|| file_name.strip_suffix(".PDF"))
        .unwrap_or(file_name);

    pdf_path.with_file_name(format!("{stem}{EDITABLE_SUFFIX}"))
}

pub fn resolve_editable_json_for_pdf(pdf_path: &Path) -> Result<PathBuf, String> {
    let beside = editable_json_path_beside_pdf(pdf_path);
    if beside.is_file() {
        return Ok(beside);
    }

    let stem = pdf_stem(pdf_path)?;
    let file_name = invoice_json_file_name(&stem)?;
    let mut current = pdf_path.parent();

    for _ in 0..6 {
        let Some(dir) = current else {
            break;
        };
        let candidate = dir.join(SHARED_JSON_DIR_NAME).join(&file_name);
        if candidate.is_file() {
            reject_unsafe_path(&candidate)?;
            return Ok(candidate);
        }
        current = dir.parent();
    }

    Err(missing_editable_data_message().to_string())
}

pub fn calculate_totals_from_products(
    products: &[EditableInvoiceProduct],
    discount_rupees: i64,
    advance_rupees: i64,
) -> Result<CalculatedInvoiceTotals, String> {
    if products.is_empty() {
        return Err("At least one product is required.".to_string());
    }

    if products.len() > MAX_PRODUCTS {
        return Err(format!(
            "An invoice can include at most {MAX_PRODUCTS} products."
        ));
    }

    let mut line_totals_rupees = Vec::with_capacity(products.len());
    let mut subtotal_rupees: i64 = 0;

    for product in products {
        validate_product(product)?;
        let line_total = product
            .quantity
            .checked_mul(product.unit_price)
            .ok_or_else(|| "Product line total is too large.".to_string())?;
        line_totals_rupees.push(line_total);
        subtotal_rupees = subtotal_rupees
            .checked_add(line_total)
            .ok_or_else(|| "Invoice subtotal is too large.".to_string())?;
    }

    if discount_rupees < 0 {
        return Err("Discount must be a finite non-negative amount.".to_string());
    }

    if discount_rupees > subtotal_rupees {
        return Err("Discount cannot exceed subtotal.".to_string());
    }

    let grand_total_rupees = subtotal_rupees - discount_rupees;

    if advance_rupees < 0 {
        return Err("Advance must be a finite non-negative amount.".to_string());
    }

    if advance_rupees > grand_total_rupees {
        return Err("Advance cannot exceed grand total.".to_string());
    }

    Ok(CalculatedInvoiceTotals {
        line_totals_rupees,
        subtotal_rupees,
        discount_amount_rupees: discount_rupees,
        grand_total_rupees,
        advance_rupees,
        pending_rupees: grand_total_rupees - advance_rupees,
    })
}

pub fn validate_editable_invoice_data(data: &EditableInvoiceData) -> Result<(), String> {
    if data.schema_version != SCHEMA_VERSION {
        return Err(format!(
            "Unsupported invoice schema version: {}. Expected {SCHEMA_VERSION}.",
            data.schema_version
        ));
    }

    if parse_invoice_number(&data.invoice_number).is_none() {
        return Err("Invoice number format is invalid.".to_string());
    }

    validate_iso_date(&data.date)?;
    validate_customer_name(&data.customer.name)?;
    validate_phone(&data.customer.phone)?;
    let _ = calculate_totals_from_products(&data.products, data.discount, data.advance)?;
    Ok(())
}

pub fn serialize_editable_invoice(data: &EditableInvoiceData) -> Result<Vec<u8>, String> {
    let mut bytes = serde_json::to_vec_pretty(data).map_err(|error| error.to_string())?;
    bytes.push(b'\n');
    Ok(bytes)
}

pub fn load_editable_invoice(path: &str) -> Result<LoadedEditableInvoice, String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err(missing_editable_data_message().to_string());
    }

    let path = PathBuf::from(trimmed);
    reject_unsafe_path(&path)?;

    let file_name = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default();

    if file_name.to_ascii_lowercase().ends_with(".pdf") {
        let json_path = resolve_editable_json_for_pdf(&path)?;
        return load_editable_invoice_from_json_path(&json_path);
    }

    if !file_name.to_ascii_lowercase().ends_with(EDITABLE_SUFFIX) {
        return Err("Select an .invoice.json file to edit.".to_string());
    }

    if !path.is_file() {
        return Err(missing_editable_data_message().to_string());
    }

    load_editable_invoice_from_json_path(&path)
}

pub fn load_editable_invoice_from_json_path(
    json_path: &Path,
) -> Result<LoadedEditableInvoice, String> {
    reject_unsafe_path(json_path)?;

    let metadata =
        fs::metadata(json_path).map_err(|_| missing_editable_data_message().to_string())?;
    if metadata.len() > MAX_JSON_BYTES {
        return Err("Invoice data file is too large.".to_string());
    }

    let bytes = fs::read(json_path).map_err(|_| missing_editable_data_message().to_string())?;
    let data: EditableInvoiceData = serde_json::from_slice(&bytes)
        .map_err(|error| format!("Invoice data file is invalid JSON: {error}"))?;

    validate_editable_invoice_data(&data)?;

    let totals = calculate_totals_from_products(&data.products, data.discount, data.advance)?;

    let pdf_path = pdf_path_for_json(json_path)?;
    let folder_path = pdf_path
        .parent()
        .map(|parent| parent.to_string_lossy().into_owned())
        .unwrap_or_default();
    let file_name = pdf_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("invoice.pdf")
        .to_string();

    Ok(LoadedEditableInvoice {
        invoice_number: data.invoice_number,
        date: data.date,
        customer_name: data.customer.name,
        phone_number: data.customer.phone,
        products: data.products,
        discount: totals.discount_amount_rupees,
        advance: totals.advance_rupees,
        json_path: json_path.to_string_lossy().into_owned(),
        pdf_path: pdf_path.to_string_lossy().into_owned(),
        folder_path,
        file_name,
    })
}

pub fn pdf_path_for_json(json_path: &Path) -> Result<PathBuf, String> {
    let file_name = json_path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "Invalid editable invoice path.".to_string())?;

    let lower = file_name.to_ascii_lowercase();
    if !lower.ends_with(EDITABLE_SUFFIX) {
        return Err("Editable invoice path must end with .invoice.json.".to_string());
    }

    let stem_len = file_name.len() - EDITABLE_SUFFIX.len();
    let stem = &file_name[..stem_len];
    if stem.is_empty() || stem.contains('/') || stem.contains('\\') || stem.contains("..") {
        return Err("Editable invoice filename is invalid.".to_string());
    }

    let parent = json_path
        .parent()
        .ok_or_else(|| "Editable invoice path has no parent folder.".to_string())?;

    let pdf_name = format!("{stem}.pdf");

    // Shared json folder: PDF lives under the invoice root (or a year/month subfolder).
    let parent_name = parent
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default();
    if parent_name.eq_ignore_ascii_case(SHARED_JSON_DIR_NAME) {
        let invoice_root = parent
            .parent()
            .ok_or_else(|| "Shared json folder has no invoice root.".to_string())?;
        reject_unsafe_path(invoice_root)?;

        let at_root = invoice_root.join(&pdf_name);
        if at_root.is_file() {
            reject_unsafe_path(&at_root)?;
            return Ok(at_root);
        }

        if let Some(found) = find_pdf_by_file_name(invoice_root, &pdf_name)? {
            return Ok(found);
        }

        return Err(
            "The matching invoice PDF could not be found beside the editable data file."
                .to_string(),
        );
    }

    // Legacy: JSON beside PDF.
    let beside = parent.join(&pdf_name);
    reject_unsafe_path(&beside)?;
    Ok(beside)
}

fn find_pdf_by_file_name(root: &Path, pdf_name: &str) -> Result<Option<PathBuf>, String> {
    fn visit(dir: &Path, pdf_name: &str, depth: u8) -> Result<Option<PathBuf>, String> {
        if depth > 4 || !dir.is_dir() {
            return Ok(None);
        }

        let entries = fs::read_dir(dir).map_err(|error| error.to_string())?;
        for entry in entries {
            let entry = entry.map_err(|error| error.to_string())?;
            let path = entry.path();
            let name = entry.file_name();
            let name_text = name.to_string_lossy();

            if name_text.eq_ignore_ascii_case(SHARED_JSON_DIR_NAME)
                || name_text.eq_ignore_ascii_case(BACKUPS_DIR_NAME)
            {
                continue;
            }

            if path.is_dir() {
                if let Some(found) = visit(&path, pdf_name, depth + 1)? {
                    return Ok(Some(found));
                }
                continue;
            }

            if name_text.eq_ignore_ascii_case(pdf_name) {
                reject_unsafe_path(&path)?;
                return Ok(Some(path));
            }
        }

        Ok(None)
    }

    visit(root, pdf_name, 0)
}

pub fn invoice_root_from_json_path(json_path: &Path) -> Result<PathBuf, String> {
    let parent = json_path
        .parent()
        .ok_or_else(|| "Editable invoice path has no parent folder.".to_string())?;
    let parent_name = parent
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or_default();

    if parent_name.eq_ignore_ascii_case(SHARED_JSON_DIR_NAME) {
        let root = parent
            .parent()
            .ok_or_else(|| "Shared json folder has no invoice root.".to_string())?
            .to_path_buf();
        reject_unsafe_path(&root)?;
        return Ok(root);
    }

    // Legacy beside-PDF JSON: treat the PDF/JSON directory as the local root for backups.
    reject_unsafe_path(parent)?;
    Ok(parent.to_path_buf())
}

pub fn format_iso_date_for_display(iso: &str) -> Result<String, String> {
    let date = NaiveDate::parse_from_str(iso.trim(), "%Y-%m-%d")
        .map_err(|_| "Invoice date must use YYYY-MM-DD format.".to_string())?;
    Ok(format!("{} {}", date.day(), date.format("%B %Y")))
}

pub fn validate_customer_name(value: &str) -> Result<(), String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err("Customer name is required.".to_string());
    }
    if trimmed.chars().count() > MAX_CUSTOMER_NAME_CHARS {
        return Err(format!(
            "Customer name must be at most {MAX_CUSTOMER_NAME_CHARS} characters."
        ));
    }
    Ok(())
}

pub fn validate_phone(value: &str) -> Result<(), String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err("Phone number is required.".to_string());
    }
    if trimmed.chars().count() > MAX_PHONE_CHARS {
        return Err(format!(
            "Phone number must be at most {MAX_PHONE_CHARS} characters."
        ));
    }

    let valid = trimmed.chars().all(|character| {
        character.is_ascii_digit()
            || character.is_whitespace()
            || matches!(character, '+' | '-' | '(' | ')')
    });
    if !valid || trimmed.chars().count() < 7 {
        return Err("Enter a valid phone number.".to_string());
    }

    Ok(())
}

pub fn reject_unsafe_path(path: &Path) -> Result<(), String> {
    if path.as_os_str().is_empty() {
        return Err("Invoice path cannot be empty.".to_string());
    }

    if !path.is_absolute() {
        return Err("Invoice path must be an absolute path.".to_string());
    }

    for component in path.components() {
        if matches!(component, Component::ParentDir) {
            return Err("Invoice path must not contain parent-directory segments.".to_string());
        }
    }

    let as_str = path.to_string_lossy();
    if as_str.contains('\0') {
        return Err("Invoice path is invalid.".to_string());
    }

    Ok(())
}

fn validate_iso_date(value: &str) -> Result<(), String> {
    NaiveDate::parse_from_str(value.trim(), "%Y-%m-%d")
        .map(|_| ())
        .map_err(|_| "Invoice date must use YYYY-MM-DD format.".to_string())
}

fn validate_product(product: &EditableInvoiceProduct) -> Result<(), String> {
    let name = product.name.trim();
    if name.is_empty() {
        return Err("Product name is required.".to_string());
    }
    if name.chars().count() > MAX_PRODUCT_NAME_CHARS {
        return Err(format!(
            "Product name must be at most {MAX_PRODUCT_NAME_CHARS} characters."
        ));
    }

    if product.quantity <= 0 {
        return Err("Quantity must be a positive integer.".to_string());
    }

    if product.unit_price < 0 {
        return Err("Unit price must be a finite non-negative amount.".to_string());
    }

    Ok(())
}
