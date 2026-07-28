use std::fs;
use std::io::BufWriter;
use std::path::Path;

use printpdf::{BuiltinFont, Color, Image, ImageTransform, Mm, PdfDocument, Rgb};
use serde::Deserialize;
use tauri::{AppHandle, Manager};

use crate::invoice_folder;
use crate::invoice_numbering::{
    finalize_invoice_sequence, resolve_invoice_save_plan, InvoiceSavePlan,
};
use crate::settings::load_settings;

const APP_SUBTITLE: &str = "Hotel Ware & Kitchen Ware";
const LOGO_FILE_NAME: &str = "Logo.jpeg";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveInvoicePdfRequest {
    pub customer_name: String,
    pub phone_number: String,
    pub products: Vec<SaveInvoiceProductLine>,
    pub discount_label: Option<String>,
    pub discount_amount_rupees: i64,
    pub subtotal_rupees: i64,
    pub grand_total_rupees: i64,
    pub advance_rupees: i64,
    pub pending_rupees: i64,
    pub invoice_date: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveInvoiceProductLine {
    pub product_name: String,
    pub quantity_display: String,
    pub unit_price_rupees: i64,
    pub line_total_rupees: i64,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveInvoicePdfResult {
    pub invoice_number: String,
    pub next_invoice_number: String,
    pub customer_name: String,
    pub grand_total_rupees: i64,
    pub advance_rupees: i64,
    pub pending_rupees: i64,
    pub folder_path: String,
    pub file_path: String,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveInvoicePdfError {
    pub code: String,
    pub message: String,
}

impl SaveInvoicePdfError {
    fn usb_unavailable(message: impl Into<String>) -> Self {
        Self {
            code: "usb_unavailable".to_string(),
            message: message.into(),
        }
    }

    fn file_exists(message: impl Into<String>) -> Self {
        Self {
            code: "file_exists".to_string(),
            message: message.into(),
        }
    }

    fn save_failed(message: impl Into<String>) -> Self {
        Self {
            code: "save_failed".to_string(),
            message: message.into(),
        }
    }
}

pub fn save_invoice_pdf(
    app: &AppHandle,
    request: &SaveInvoicePdfRequest,
) -> Result<SaveInvoicePdfResult, SaveInvoicePdfError> {
    let settings = load_settings(app).map_err(SaveInvoicePdfError::save_failed)?;

    let invoice_root = settings
        .selected_invoice_directory
        .as_deref()
        .ok_or_else(|| SaveInvoicePdfError::usb_unavailable("No invoice folder selected."))?;

    if !invoice_folder::is_directory_available(invoice_root) {
        return Err(SaveInvoicePdfError::usb_unavailable(
            "The selected invoice folder is not available.",
        ));
    }

    let save_plan =
        resolve_invoice_save_plan(&settings, &request.customer_name).map_err(|error| {
            if error.contains("No invoice folder") {
                SaveInvoicePdfError::usb_unavailable(error)
            } else {
                SaveInvoicePdfError::save_failed(error)
            }
        })?;

    if save_plan.file_exists || Path::new(&save_plan.file_path).exists() {
        return Err(SaveInvoicePdfError::file_exists(
            "An invoice PDF with this filename already exists.",
        ));
    }

    let pdf_bytes = generate_invoice_pdf(app, &save_plan, request)
        .map_err(SaveInvoicePdfError::save_failed)?;

    atomic_write_bytes(Path::new(&save_plan.file_path), &pdf_bytes)
        .map_err(SaveInvoicePdfError::save_failed)?;

    finalize_invoice_sequence(app, save_plan.year, save_plan.sequence)
        .map_err(SaveInvoicePdfError::save_failed)?;

    Ok(SaveInvoicePdfResult {
        invoice_number: save_plan.invoice_number.clone(),
        next_invoice_number: save_plan.next_invoice_number.clone(),
        customer_name: request.customer_name.trim().to_string(),
        grand_total_rupees: request.grand_total_rupees,
        advance_rupees: request.advance_rupees,
        pending_rupees: request.pending_rupees,
        folder_path: save_plan.folder_path.clone(),
        file_path: save_plan.file_path.clone(),
    })
}

fn atomic_write_bytes(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let temp_path = path.with_extension("pdf.tmp");

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    fs::write(&temp_path, bytes).map_err(|error| error.to_string())?;
    fs::rename(&temp_path, path).map_err(|error| error.to_string())?;

    Ok(())
}

fn resolve_logo_path(app: &AppHandle) -> Option<std::path::PathBuf> {
    let bundled = app
        .path()
        .resolve(LOGO_FILE_NAME, tauri::path::BaseDirectory::Resource)
        .ok()
        .filter(|path| path.exists());

    if bundled.is_some() {
        return bundled;
    }

    let dev_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../src/assets/Logo.jpeg");
    dev_path.exists().then_some(dev_path)
}

fn generate_invoice_pdf(
    app: &AppHandle,
    save_plan: &InvoiceSavePlan,
    request: &SaveInvoicePdfRequest,
) -> Result<Vec<u8>, String> {
    let (document, page_index, layer_index) =
        PdfDocument::new("Meer Ilyas Invoice", Mm(148.0), Mm(210.0), "Layer 1");
    let page = document.get_page(page_index);
    let layer = page.get_layer(layer_index);

    let font_regular = document
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|error| error.to_string())?;
    let font_bold = document
        .add_builtin_font(BuiltinFont::HelveticaBold)
        .map_err(|error| error.to_string())?;

    let navy = rgb_color(36, 32, 120);
    let muted = rgb_color(102, 107, 122);
    let red = rgb_color(239, 24, 34);
    let text = rgb_color(37, 40, 56);

    let page_width = 148.0;
    let left = 12.0;
    let right = page_width - 12.0;
    let mut cursor_y = 198.0;

    if let Some(logo_path) = resolve_logo_path(app) {
        if let Ok(dynamic_image) = image::open(&logo_path) {
            let pdf_image = Image::from_dynamic_image(&dynamic_image);
            pdf_image.add_to_layer(
                layer.clone(),
                ImageTransform {
                    translate_x: Some(Mm(left)),
                    translate_y: Some(Mm(cursor_y - 18.0)),
                    scale_x: Some(0.18),
                    scale_y: Some(0.18),
                    dpi: Some(300.0),
                    ..Default::default()
                },
            );
            cursor_y -= 22.0;
        }
    }

    write_text(
        &layer,
        &font_bold,
        12.0,
        left,
        cursor_y,
        "MEER ILYAS",
        navy.clone(),
    );
    write_text(
        &layer,
        &font_bold,
        7.0,
        left,
        cursor_y - 4.0,
        APP_SUBTITLE.to_uppercase(),
        navy.clone(),
    );
    write_text(
        &layer,
        &font_regular,
        7.0,
        left,
        cursor_y - 9.0,
        "Main Market, Sector G-9/4,",
        muted.clone(),
    );
    write_text(
        &layer,
        &font_regular,
        7.0,
        left,
        cursor_y - 13.0,
        "Islamabad, Pakistan",
        muted.clone(),
    );
    write_text(
        &layer,
        &font_regular,
        7.0,
        left,
        cursor_y - 17.0,
        "Ph: +92 51 1234567",
        muted.clone(),
    );

    write_text(
        &layer,
        &font_bold,
        13.0,
        right - 28.0,
        cursor_y,
        "INVOICE",
        navy.clone(),
    );
    write_text(
        &layer,
        &font_bold,
        8.5,
        right - 44.0,
        cursor_y - 5.5,
        &format!("# {}", save_plan.invoice_number),
        navy.clone(),
    );
    write_text(
        &layer,
        &font_regular,
        7.0,
        right - 50.0,
        cursor_y - 10.5,
        &format!("Date: {}", request.invoice_date),
        muted.clone(),
    );

    cursor_y -= 24.0;
    write_text(
        &layer,
        &font_regular,
        6.5,
        left,
        cursor_y,
        "────────────────────────────────────────────────────────",
        muted.clone(),
    );
    cursor_y -= 6.0;

    write_text(
        &layer,
        &font_bold,
        7.5,
        left,
        cursor_y,
        &format!("BILL TO: {}", request.customer_name.trim()),
        text.clone(),
    );
    write_text(
        &layer,
        &font_bold,
        7.5,
        right - 52.0,
        cursor_y,
        &format!("CONTACT: {}", request.phone_number.trim()),
        text.clone(),
    );
    cursor_y -= 8.0;

    let qty_x = left + 78.0;
    let price_x = left + 96.0;
    let total_x = right - 2.0;

    write_text(
        &layer,
        &font_bold,
        6.5,
        left,
        cursor_y,
        "ITEM DESCRIPTION",
        muted.clone(),
    );
    write_text(
        &layer,
        &font_bold,
        6.5,
        qty_x,
        cursor_y,
        "QTY",
        muted.clone(),
    );
    write_text(
        &layer,
        &font_bold,
        6.5,
        price_x,
        cursor_y,
        "PRICE",
        muted.clone(),
    );
    write_text_right(
        &layer,
        &font_bold,
        6.5,
        total_x,
        cursor_y,
        "TOTAL",
        muted.clone(),
    );
    cursor_y -= 4.0;
    write_text(
        &layer,
        &font_regular,
        6.5,
        left,
        cursor_y,
        "────────────────────────────────────────────────────────",
        muted.clone(),
    );
    cursor_y -= 5.0;

    let row_height = if request.products.len() > 12 {
        5.8
    } else {
        6.8
    };
    let row_font_size = if request.products.len() > 12 { 7.0 } else { 7.5 };

    for product in &request.products {
        write_text(
            &layer,
            &font_regular,
            row_font_size,
            left,
            cursor_y,
            &truncate_text(&product.product_name, 42),
            text.clone(),
        );
        write_text(
            &layer,
            &font_regular,
            row_font_size,
            qty_x + 2.0,
            cursor_y,
            &product.quantity_display,
            text.clone(),
        );
        write_text_right(
            &layer,
            &font_regular,
            row_font_size,
            price_x + 14.0,
            cursor_y,
            &format_integer(product.unit_price_rupees),
            text.clone(),
        );
        write_text_right(
            &layer,
            &font_bold,
            row_font_size,
            total_x,
            cursor_y,
            &format_integer(product.line_total_rupees),
            text.clone(),
        );
        cursor_y -= row_height;
    }

    cursor_y -= 4.0;
    let totals_left = right - 58.0;

    write_totals_row(
        &layer,
        &font_regular,
        &font_bold,
        totals_left,
        right,
        cursor_y,
        "Subtotal",
        &format_rupees(request.subtotal_rupees),
        muted.clone(),
        text.clone(),
    );
    cursor_y -= 5.5;

    if request.discount_amount_rupees > 0 {
        let discount_label = request
            .discount_label
            .clone()
            .unwrap_or_else(|| "Discount".to_string());
        write_totals_row(
            &layer,
            &font_regular,
            &font_bold,
            totals_left,
            right,
            cursor_y,
            &discount_label,
            &format!("- {}", format_rupees(request.discount_amount_rupees)),
            muted.clone(),
            red.clone(),
        );
        cursor_y -= 5.5;
    }

    write_totals_row(
        &layer,
        &font_bold,
        &font_bold,
        totals_left,
        right,
        cursor_y,
        "Grand Total",
        &format_rupees(request.grand_total_rupees),
        navy.clone(),
        navy.clone(),
    );
    cursor_y -= 6.0;

    if request.advance_rupees > 0 {
        write_totals_row(
            &layer,
            &font_regular,
            &font_bold,
            totals_left,
            right,
            cursor_y,
            "Advance Paid",
            &format_rupees(request.advance_rupees),
            muted.clone(),
            red.clone(),
        );
        cursor_y -= 5.5;
    }

    write_totals_row(
        &layer,
        &font_bold,
        &font_bold,
        totals_left,
        right,
        cursor_y,
        "Pending Amount",
        &format_rupees(request.pending_rupees),
        red.clone(),
        red.clone(),
    );

    let mut buffer = Vec::new();
    {
        let mut writer = BufWriter::new(&mut buffer);
        document
            .save(&mut writer)
            .map_err(|error| error.to_string())?;
    }

    Ok(buffer)
}

fn write_totals_row(
    layer: &printpdf::PdfLayerReference,
    label_font: &printpdf::IndirectFontRef,
    value_font: &printpdf::IndirectFontRef,
    left: f32,
    right: f32,
    y: f32,
    label: &str,
    value: &str,
    label_color: Color,
    value_color: Color,
) {
    write_text(layer, label_font, 7.5, left, y, label, label_color);
    write_text_right(layer, value_font, 7.5, right, y, value, value_color);
}

fn write_text(
    layer: &printpdf::PdfLayerReference,
    font: &printpdf::IndirectFontRef,
    size: f32,
    x: f32,
    y: f32,
    text: &str,
    color: Color,
) {
    layer.set_fill_color(color);
    layer.use_text(text, size, Mm(x), Mm(y), font);
}

fn write_text_right(
    layer: &printpdf::PdfLayerReference,
    font: &printpdf::IndirectFontRef,
    size: f32,
    right_x: f32,
    y: f32,
    text: &str,
    color: Color,
) {
    let width_estimate = text.chars().count() as f32 * size * 0.18;
    write_text(
        layer,
        font,
        size,
        (right_x - width_estimate).max(0.0),
        y,
        text,
        color,
    );
}

fn rgb_color(r: u8, g: u8, b: u8) -> Color {
    Color::Rgb(Rgb::new(
        r as f32 / 255.0,
        g as f32 / 255.0,
        b as f32 / 255.0,
        None,
    ))
}

fn format_rupees(amount: i64) -> String {
    format!("Rs. {}", format_integer(amount))
}

fn format_integer(value: i64) -> String {
    let negative = value < 0;
    let digits: Vec<char> = value.abs().to_string().chars().collect();
    let mut formatted = String::new();

    for (index, digit) in digits.iter().enumerate() {
        if index > 0 && (digits.len() - index) % 3 == 0 {
            formatted.push(',');
        }
        formatted.push(*digit);
    }

    if negative {
        format!("-{formatted}")
    } else {
        formatted
    }
}

fn truncate_text(value: &str, max_chars: usize) -> String {
    let trimmed = value.trim();
    if trimmed.chars().count() <= max_chars {
        return trimmed.to_string();
    }

    trimmed
        .chars()
        .take(max_chars.saturating_sub(1))
        .collect::<String>()
        + "…"
}
