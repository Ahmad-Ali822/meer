use std::fs;
use std::path::{Path, PathBuf};

use chrono::{Datelike, Local};
use serde::{Deserialize, Serialize};

use crate::invoice_folder;
use crate::settings::{atomic_write_json, load_settings, save_settings, AppSettings};

pub const INVOICE_PREFIX: &str = "MI";
pub const USB_SEQUENCE_FILE_NAME: &str = "invoice-sequence.json";
const MAX_SEQUENCE: u32 = 9999;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SequenceMetadata {
    #[serde(default = "default_sequence_year")]
    pub year: i32,
    #[serde(default)]
    pub last_successful_sequence: u32,
}

fn default_sequence_year() -> i32 {
    current_year()
}

impl Default for SequenceMetadata {
    fn default() -> Self {
        Self {
            year: current_year(),
            last_successful_sequence: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProposedInvoiceNumber {
    pub invoice_number: String,
    pub next_invoice_number: String,
    pub year: i32,
    pub sequence: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceSavePlan {
    pub invoice_number: String,
    pub next_invoice_number: String,
    pub year: i32,
    pub sequence: u32,
    pub folder_path: String,
    pub file_name: String,
    pub file_path: String,
    pub file_exists: bool,
}

pub fn current_year() -> i32 {
    Local::now().year()
}

pub fn format_invoice_number(year: i32, sequence: u32) -> String {
    format!("{INVOICE_PREFIX}-{year}-{sequence:04}")
}

pub fn parse_invoice_number(value: &str) -> Option<(i32, u32)> {
    let trimmed = value.trim();
    let mut parts = trimmed.split('-');

    if parts.next()? != INVOICE_PREFIX {
        return None;
    }

    let year = parts.next()?.parse().ok()?;
    let sequence = parts.next()?.parse().ok()?;

    if parts.next().is_some() {
        return None;
    }

    Some((year, sequence))
}

pub fn parse_invoice_pdf_filename(filename: &str) -> Option<(i32, u32)> {
    let stem = Path::new(filename)
        .file_stem()
        .and_then(|value| value.to_str())?;

    if !stem.starts_with(&format!("{INVOICE_PREFIX}-")) {
        return None;
    }

    let remainder = &stem[INVOICE_PREFIX.len() + 1..];
    let mut parts = remainder.splitn(3, '-');
    let year = parts.next()?.parse().ok()?;
    let sequence = parts.next()?.parse().ok()?;

    if parts.next().is_none() {
        return None;
    }

    Some((year, sequence))
}

pub fn sanitize_customer_name_for_filename(customer_name: &str) -> String {
    let mut slug = String::new();
    let mut previous_was_hyphen = false;

    for character in customer_name.trim().chars() {
        if matches!(
            character,
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*'
        ) {
            continue;
        }

        if character.is_whitespace() {
            if !slug.is_empty() && !previous_was_hyphen {
                slug.push('-');
                previous_was_hyphen = true;
            }
            continue;
        }

        slug.push(character);
        previous_was_hyphen = false;
    }

    slug.trim_matches('-').to_string()
}

pub fn build_invoice_subfolder(root: &Path, date: chrono::DateTime<Local>) -> PathBuf {
    let month_name = date.format("%B").to_string();
    root.join(date.format("%Y").to_string()).join(month_name)
}

fn usb_sequence_path(root: &Path) -> PathBuf {
    root.join(USB_SEQUENCE_FILE_NAME)
}

fn load_usb_sequence(root: &Path) -> SequenceMetadata {
    let path = usb_sequence_path(root);

    if !path.exists() {
        return SequenceMetadata::default();
    }

    match fs::read_to_string(&path) {
        Ok(contents) => serde_json::from_str(&contents).unwrap_or_default(),
        Err(_) => SequenceMetadata::default(),
    }
}

fn save_usb_sequence(root: &Path, metadata: &SequenceMetadata) -> Result<(), String> {
    atomic_write_json(&usb_sequence_path(root), metadata)
}

fn sequence_from_settings(settings: &AppSettings, target_year: i32) -> u32 {
    if settings.year == target_year {
        settings.last_successful_sequence
    } else {
        0
    }
}

fn scan_pdf_sequences(root: &Path, target_year: i32) -> Result<u32, String> {
    let mut max_sequence = 0;

    if !root.exists() {
        return Ok(max_sequence);
    }

    visit_pdfs(root, target_year, &mut max_sequence)?;

    Ok(max_sequence)
}

fn visit_pdfs(dir: &Path, target_year: i32, max_sequence: &mut u32) -> Result<(), String> {
    if !dir.is_dir() {
        return Ok(());
    }

    let entries = fs::read_dir(dir).map_err(|error| error.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();

        if path.is_dir() {
            visit_pdfs(&path, target_year, max_sequence)?;
            continue;
        }

        let is_pdf = path
            .extension()
            .and_then(|extension| extension.to_str())
            .is_some_and(|extension| extension.eq_ignore_ascii_case("pdf"));

        if !is_pdf {
            continue;
        }

        let Some(file_name) = path.file_name().and_then(|name| name.to_str()) else {
            continue;
        };

        if let Some((year, sequence)) = parse_invoice_pdf_filename(file_name) {
            if year == target_year {
                *max_sequence = (*max_sequence).max(sequence);
            }
        }
    }

    Ok(())
}

pub fn find_highest_sequence(
    settings: &AppSettings,
    invoice_root: Option<&Path>,
    target_year: i32,
) -> Result<u32, String> {
    let mut max_sequence = sequence_from_settings(settings, target_year);

    if let Some(root) = invoice_root {
        let usb_sequence = load_usb_sequence(root);

        if usb_sequence.year == target_year {
            max_sequence = max_sequence.max(usb_sequence.last_successful_sequence);
        }

        max_sequence = max_sequence.max(scan_pdf_sequences(root, target_year)?);
    }

    Ok(max_sequence)
}

pub fn get_proposed_invoice_number(
    settings: &AppSettings,
) -> Result<ProposedInvoiceNumber, String> {
    let target_year = current_year();
    let invoice_root = settings
        .selected_invoice_directory
        .as_deref()
        .map(Path::new);

    let highest_sequence = find_highest_sequence(settings, invoice_root, target_year)?;
    let sequence = highest_sequence.saturating_add(1).min(MAX_SEQUENCE);

    if sequence > MAX_SEQUENCE {
        return Err("Invoice sequence limit reached for this year.".to_string());
    }

    let invoice_number = format_invoice_number(target_year, sequence);
    let next_invoice_number = if sequence >= MAX_SEQUENCE {
        invoice_number.clone()
    } else {
        format_invoice_number(target_year, sequence + 1)
    };

    Ok(ProposedInvoiceNumber {
        invoice_number,
        next_invoice_number,
        year: target_year,
        sequence,
    })
}

pub fn resolve_invoice_save_plan(
    settings: &AppSettings,
    customer_name: &str,
) -> Result<InvoiceSavePlan, String> {
    let invoice_root = settings
        .selected_invoice_directory
        .as_ref()
        .ok_or_else(|| "No invoice folder selected.".to_string())?;

    let root_path = Path::new(invoice_root);
    let target_year = current_year();
    let highest_sequence = find_highest_sequence(settings, Some(root_path), target_year)?;
    let mut sequence = highest_sequence.saturating_add(1);
    let subfolder = build_invoice_subfolder(root_path, Local::now());
    let customer_slug = sanitize_customer_name_for_filename(customer_name);
    let customer_slug = if customer_slug.is_empty() {
        "Customer".to_string()
    } else {
        customer_slug
    };

    if let Some(parent) = subfolder.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    fs::create_dir_all(&subfolder).map_err(|error| error.to_string())?;

    loop {
        if sequence > MAX_SEQUENCE {
            return Err("Invoice sequence limit reached for this year.".to_string());
        }

        let invoice_number = format_invoice_number(target_year, sequence);
        let file_name = format!("{invoice_number}-{customer_slug}.pdf");
        let file_path = subfolder.join(&file_name);

        if !file_path.exists() {
            let next_invoice_number = if sequence >= MAX_SEQUENCE {
                invoice_number.clone()
            } else {
                format_invoice_number(target_year, sequence + 1)
            };

            return Ok(InvoiceSavePlan {
                invoice_number,
                next_invoice_number,
                year: target_year,
                sequence,
                folder_path: subfolder.to_string_lossy().into_owned(),
                file_name,
                file_path: file_path.to_string_lossy().into_owned(),
                file_exists: false,
            });
        }

        sequence += 1;
    }
}

pub fn finalize_invoice_sequence(
    app: &tauri::AppHandle,
    year: i32,
    sequence: u32,
) -> Result<ProposedInvoiceNumber, String> {
    let mut settings = load_settings(app)?;
    settings.year = year;
    settings.last_successful_sequence = sequence;
    save_settings(app, &settings)?;

    if let Some(invoice_root) = settings.selected_invoice_directory.as_deref() {
        let root_path = Path::new(invoice_root);

        if invoice_folder::is_directory_available(invoice_root) {
            save_usb_sequence(
                root_path,
                &SequenceMetadata {
                    year,
                    last_successful_sequence: sequence,
                },
            )?;
        }
    }

    get_proposed_invoice_number(&settings)
}

/// Resets the persisted invoice counter so the next invoice is MI-YYYY-0001.
pub fn reset_invoice_sequence_counter(app: &tauri::AppHandle) -> Result<(), String> {
    let mut settings = load_settings(app)?;
    settings.year = Local::now().year();
    settings.last_successful_sequence = 0;
    save_settings(app, &settings)?;

    if let Some(invoice_root) = settings.selected_invoice_directory.as_deref() {
        let root_path = Path::new(invoice_root);

        if invoice_folder::is_directory_available(invoice_root) {
            save_usb_sequence(
                root_path,
                &SequenceMetadata {
                    year: settings.year,
                    last_successful_sequence: 0,
                },
            )?;
        }
    }

    Ok(())
}
