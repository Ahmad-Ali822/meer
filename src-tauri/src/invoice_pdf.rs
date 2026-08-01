use std::fs;
use std::io::BufWriter;
use std::path::Path;

use printpdf::path::{PaintMode, WindingOrder};
use printpdf::{
    BuiltinFont, Color, Image, ImageTransform, Line, Mm, PdfDocument, Point, Polygon, Rgb,
};
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

impl std::fmt::Display for SaveInvoicePdfError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for SaveInvoicePdfError {}

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

    let pdf_bytes =
        generate_invoice_pdf(app, &save_plan, request).map_err(SaveInvoicePdfError::save_failed)?;

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
    let mut current_page = document.get_page(page_index);
    let mut current_layer = current_page.get_layer(layer_index);
    let mut page_count = 1;

    let font_regular = document
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|error| error.to_string())?;
    let font_bold = document
        .add_builtin_font(BuiltinFont::HelveticaBold)
        .map_err(|error| error.to_string())?;

    let navy = rgb_color(30, 27, 110);
    let red = rgb_color(239, 24, 34);
    let yellow = rgb_color(244, 181, 28);
    let banner_bg = rgb_color(243, 244, 248);
    let border_grey = rgb_color(215, 218, 227);
    let alt_row_bg = rgb_color(248, 249, 252);
    let text_dark = rgb_color(37, 40, 56);
    let white = rgb_color(255, 255, 255);

    let left = 10.0;
    let right = 138.0;

    let draw_margin_bar = |layer: &printpdf::PdfLayerReference| {
        draw_rect(layer, 0.0, 84.0, 3.0, 126.0, Some(navy.clone()), None);
        draw_rect(layer, 0.0, 0.0, 3.0, 84.0, Some(red.clone()), None);
    };

    draw_margin_bar(&current_layer);

    // 1. Header: Logo (left) & INVOICE title (right)
    let mut cursor_y = 196.0;

    if let Some(logo_path) = resolve_logo_path(app) {
        if let Ok(logo_bytes) = fs::read(&logo_path) {
            if let Ok(dynamic_image) = image::load_from_memory(&logo_bytes) {
                let pdf_image = Image::from_dynamic_image(&dynamic_image);
                pdf_image.add_to_layer(
                    current_layer.clone(),
                    ImageTransform {
                        translate_x: Some(Mm(left)),
                        translate_y: Some(Mm(cursor_y - 14.0)),
                        scale_x: Some(0.35),
                        scale_y: Some(0.35),
                        dpi: Some(300.0),
                        ..Default::default()
                    },
                );
            }
        }
    }

    // "INVOICE" Title
    write_text_right(
        &current_layer,
        &font_bold,
        22.0,
        right,
        cursor_y - 2.0,
        "INVOICE",
        navy.clone(),
    );
    // Thick Red Bar under "INVOICE"
    draw_line(
        &current_layer,
        right - 40.0,
        cursor_y - 6.0,
        right,
        cursor_y - 6.0,
        1.5,
        red.clone(),
    );

    cursor_y -= 22.0;

    // 2. Invoice No. & Date Banner
    let banner_h = 8.5;
    draw_rect(
        &current_layer,
        left,
        cursor_y - banner_h,
        right - left,
        banner_h,
        Some(banner_bg),
        None,
    );
    draw_rect(
        &current_layer,
        left,
        cursor_y - banner_h,
        1.5,
        banner_h,
        Some(yellow),
        None,
    );

    write_text(
        &current_layer,
        &font_bold,
        7.5,
        left + 4.0,
        cursor_y - 5.5,
        "Invoice No.",
        navy.clone(),
    );
    write_text(
        &current_layer,
        &font_regular,
        7.5,
        left + 22.0,
        cursor_y - 5.5,
        &save_plan.invoice_number,
        text_dark.clone(),
    );

    write_text_right(
        &current_layer,
        &font_bold,
        7.5,
        right - 24.0,
        cursor_y - 5.5,
        "Date",
        navy.clone(),
    );
    write_text_right(
        &current_layer,
        &font_regular,
        7.5,
        right - 4.0,
        cursor_y - 5.5,
        &request.invoice_date,
        text_dark.clone(),
    );

    cursor_y -= 14.0;

    // 3. BILL TO Section
    write_text(
        &current_layer,
        &font_bold,
        9.5,
        left,
        cursor_y,
        "BILL TO",
        red.clone(),
    );
    cursor_y -= 2.5;
    draw_line(
        &current_layer,
        left,
        cursor_y,
        right,
        cursor_y,
        0.6,
        navy.clone(),
    );

    cursor_y -= 6.0;
    write_text(
        &current_layer,
        &font_bold,
        7.5,
        left,
        cursor_y,
        "Customer Name",
        navy.clone(),
    );
    let cust_name = if request.customer_name.trim().is_empty() {
        "—"
    } else {
        request.customer_name.trim()
    };
    let customer_value_x = left + 26.0;
    let customer_field_width = 38.0;
    write_text(
        &current_layer,
        &font_regular,
        7.5,
        customer_value_x,
        cursor_y,
        cust_name,
        text_dark.clone(),
    );
    draw_line(
        &current_layer,
        customer_value_x,
        cursor_y - 1.5,
        customer_value_x + customer_field_width,
        cursor_y - 1.5,
        0.35,
        navy.clone(),
    );

    write_text(
        &current_layer,
        &font_bold,
        7.5,
        left + 68.0,
        cursor_y,
        "Phone",
        navy.clone(),
    );
    let phone_num = if request.phone_number.trim().is_empty() {
        "—"
    } else {
        request.phone_number.trim()
    };
    let phone_value_x = left + 80.0;
    let phone_field_width = 48.0;
    write_text(
        &current_layer,
        &font_regular,
        7.5,
        phone_value_x,
        cursor_y,
        phone_num,
        text_dark.clone(),
    );
    draw_line(
        &current_layer,
        phone_value_x,
        cursor_y - 1.5,
        phone_value_x + phone_field_width,
        cursor_y - 1.5,
        0.35,
        navy.clone(),
    );

    cursor_y -= 10.0;

    let draw_table_header = |layer: &printpdf::PdfLayerReference, y: f32| {
        let table_header_h = 7.5;
        draw_rect(
            layer,
            left,
            y - table_header_h,
            right - left,
            table_header_h,
            Some(navy.clone()),
            None,
        );

        let num_x = left + 3.0;
        let prod_x = left + 10.0;
        let qty_x = left + 76.0;
        let price_x = left + 104.0;
        let total_x = right - 3.0;

        write_text(layer, &font_bold, 7.0, num_x, y - 5.0, "#", white.clone());
        write_text(
            layer,
            &font_bold,
            7.0,
            prod_x,
            y - 5.0,
            "PRODUCT",
            white.clone(),
        );
        write_text(layer, &font_bold, 7.0, qty_x, y - 5.0, "QTY", white.clone());
        write_text_right(
            layer,
            &font_bold,
            6.5,
            price_x,
            y - 5.0,
            "UNIT PRICE (PKR)",
            white.clone(),
        );
        write_text_right(
            layer,
            &font_bold,
            6.5,
            total_x,
            y - 5.0,
            "AMOUNT (PKR)",
            white.clone(),
        );
    };

    draw_table_header(&current_layer, cursor_y);
    cursor_y -= 7.5;

    let num_x = left + 3.0;
    let prod_x = left + 10.0;
    let qty_x = left + 76.0;
    let price_x = left + 104.0;
    let total_x = right - 3.0;

    let row_h = 6.8;
    let min_y_for_product = 50.0;

    for (index, product) in request.products.iter().enumerate() {
        if cursor_y - row_h < min_y_for_product {
            write_text_center(
                &current_layer,
                &font_regular,
                7.5,
                74.0,
                14.0,
                "Continued on next page…",
                text_dark.clone(),
            );

            page_count += 1;
            let (page_idx, layer_idx) =
                document.add_page(Mm(148.0), Mm(210.0), format!("Layer {}", page_count));
            current_page = document.get_page(page_idx);
            current_layer = current_page.get_layer(layer_idx);

            draw_margin_bar(&current_layer);

            cursor_y = 196.0;
            write_text(
                &current_layer,
                &font_bold,
                10.0,
                left,
                cursor_y,
                &format!(
                    "MEER ILYAS - Invoice # {} (Cont.)",
                    save_plan.invoice_number
                ),
                navy.clone(),
            );
            cursor_y -= 8.0;

            draw_table_header(&current_layer, cursor_y);
            cursor_y -= 7.5;
        }

        let is_odd = index % 2 == 1;
        let bg_color = if is_odd {
            Some(alt_row_bg.clone())
        } else {
            None
        };

        draw_rect(
            &current_layer,
            left,
            cursor_y - row_h,
            right - left,
            row_h,
            bg_color,
            Some(border_grey.clone()),
        );

        let row_num = format!("{}", index + 1);
        write_text(
            &current_layer,
            &font_regular,
            7.0,
            num_x,
            cursor_y - 4.8,
            &row_num,
            rgb_color(100, 100, 100),
        );
        write_text(
            &current_layer,
            &font_bold,
            7.0,
            prod_x,
            cursor_y - 4.8,
            &truncate_text(&product.product_name, 38),
            text_dark.clone(),
        );
        write_text(
            &current_layer,
            &font_bold,
            7.0,
            qty_x + 1.0,
            cursor_y - 4.8,
            &product.quantity_display,
            text_dark.clone(),
        );
        write_text_right(
            &current_layer,
            &font_bold,
            7.0,
            price_x,
            cursor_y - 4.8,
            &format_integer(product.unit_price_rupees),
            text_dark.clone(),
        );
        write_text_right(
            &current_layer,
            &font_bold,
            7.0,
            total_x,
            cursor_y - 4.8,
            &format_integer(product.line_total_rupees),
            text_dark.clone(),
        );

        cursor_y -= row_h;
    }

    cursor_y -= 6.0;

    let mut totals_rows = 3_u32; // Subtotal, Grand Total, Pending Amount
    if request.discount_amount_rupees > 0 {
        totals_rows += 1;
    }
    if request.advance_rupees > 0 {
        totals_rows += 1;
    }
    // Row pitch + pending underline + 8mm gap + separator + 3mm + thank-you + 3mm + address + pad
    let totals_and_footer_height = (totals_rows as f32) * 5.5 + 1.5 + 8.0 + 3.0 + 3.0 + 12.0;
    if cursor_y - totals_and_footer_height < 10.0 {
        write_text_center(
            &current_layer,
            &font_regular,
            7.5,
            74.0,
            14.0,
            "Continued on next page…",
            text_dark.clone(),
        );

        page_count += 1;
        let (page_idx, layer_idx) =
            document.add_page(Mm(148.0), Mm(210.0), format!("Layer {}", page_count));
        current_page = document.get_page(page_idx);
        current_layer = current_page.get_layer(layer_idx);

        draw_margin_bar(&current_layer);
        cursor_y = 190.0;
    }

    let totals_left = right - 62.0;
    // Mutable vertical cursor for the payment-summary block.
    let mut current_y = cursor_y;

    write_totals_row(
        &current_layer,
        &font_regular,
        &font_bold,
        totals_left,
        right,
        current_y,
        "Subtotal",
        &format_rupees(request.subtotal_rupees),
        navy.clone(),
        navy.clone(),
        navy.clone(),
    );
    current_y -= 5.5;

    if request.discount_amount_rupees > 0 {
        let discount_label = request
            .discount_label
            .clone()
            .unwrap_or_else(|| "Discount".to_string());
        write_totals_row(
            &current_layer,
            &font_regular,
            &font_bold,
            totals_left,
            right,
            current_y,
            &discount_label,
            &format!("- {}", format_rupees(request.discount_amount_rupees)),
            red.clone(),
            red.clone(),
            navy.clone(),
        );
        current_y -= 5.5;
    }

    write_totals_row(
        &current_layer,
        &font_regular,
        &font_bold,
        totals_left,
        right,
        current_y,
        "Grand Total",
        &format_rupees(request.grand_total_rupees),
        navy.clone(),
        navy.clone(),
        navy.clone(),
    );
    current_y -= 5.5;

    if request.advance_rupees > 0 {
        write_totals_row(
            &current_layer,
            &font_regular,
            &font_bold,
            totals_left,
            right,
            current_y,
            "Advance Paid",
            &format_rupees(request.advance_rupees),
            red.clone(),
            red.clone(),
            navy.clone(),
        );
        current_y -= 5.5;
    }

    // Pending Amount is always the last payment-summary row.
    let pending_amount_y = current_y;
    write_totals_row(
        &current_layer,
        &font_regular,
        &font_bold,
        totals_left,
        right,
        pending_amount_y,
        "Pending Amount",
        &format_rupees(request.pending_rupees),
        red.clone(),
        red.clone(),
        navy.clone(),
    );
    // Bottom edge of Pending Amount = its amount underline (see write_totals_row).
    let pending_bottom_y = pending_amount_y - 1.5;

    draw_final_invoice_footer(
        &current_layer,
        &font_bold,
        left,
        right,
        pending_bottom_y,
        navy.clone(),
        border_grey.clone(),
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

fn draw_rect(
    layer: &printpdf::PdfLayerReference,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    fill_color: Option<Color>,
    stroke_color: Option<Color>,
) {
    if let Some(fill) = &fill_color {
        layer.set_fill_color(fill.clone());
    }
    if let Some(stroke) = &stroke_color {
        layer.set_outline_color(stroke.clone());
        layer.set_outline_thickness(0.3);
    } else {
        layer.set_outline_thickness(0.0);
    }

    let polygon = Polygon {
        rings: vec![vec![
            (Point::new(Mm(x), Mm(y)), false),
            (Point::new(Mm(x + width), Mm(y)), false),
            (Point::new(Mm(x + width), Mm(y + height)), false),
            (Point::new(Mm(x), Mm(y + height)), false),
        ]],
        mode: match (fill_color.is_some(), stroke_color.is_some()) {
            (true, true) => PaintMode::FillStroke,
            (true, false) => PaintMode::Fill,
            (false, true) => PaintMode::Stroke,
            (false, false) => return,
        },
        winding_order: WindingOrder::NonZero,
    };

    layer.add_polygon(polygon);
}

fn draw_line(
    layer: &printpdf::PdfLayerReference,
    x1: f32,
    y1: f32,
    x2: f32,
    y2: f32,
    thickness: f32,
    color: Color,
) {
    layer.set_outline_color(color);
    layer.set_outline_thickness(thickness);

    let points = vec![
        (printpdf::Point::new(Mm(x1), Mm(y1)), false),
        (printpdf::Point::new(Mm(x2), Mm(y2)), false),
    ];

    let line = Line {
        points,
        is_closed: false,
    };

    layer.add_line(line);
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
    underline_color: Color,
) {
    write_text(layer, label_font, 7.5, left, y, label, label_color);
    write_text_right(layer, value_font, 7.5, right, y, value, value_color);

    let amount_underline_width = 28.0;
    draw_line(
        layer,
        right - amount_underline_width,
        y - 1.5,
        right,
        y - 1.5,
        0.35,
        underline_color,
    );
}

/// Draws the final invoice footer block relative to the Pending Amount bottom edge.
/// PDF Y decreases downward. All values are millimetres.
fn draw_final_invoice_footer(
    layer: &printpdf::PdfLayerReference,
    font_bold: &printpdf::IndirectFontRef,
    left: f32,
    right: f32,
    pending_bottom_y: f32,
    navy: Color,
    border_grey: Color,
) {
    // pending_bottom_y → 8 mm empty → separator → 3 mm → thank you → 3 mm → address
    let separator_y = pending_bottom_y - 8.0;
    let thank_you_y = separator_y - 3.0;
    let address_y = thank_you_y - 3.0;

    draw_line(
        layer,
        left,
        separator_y,
        right,
        separator_y,
        0.4,
        border_grey,
    );

    write_text_center(
        layer,
        font_bold,
        8.5,
        74.0,
        thank_you_y,
        "Thank you for shopping with us!",
        navy.clone(),
    );
    write_text_center(
        layer,
        font_bold,
        7.5,
        74.0,
        address_y,
        "Shop # 5,Gap Choek Bakhtywala - 34 Muslim Road Gujranwala",
        navy,
    );
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

fn write_text_center(
    layer: &printpdf::PdfLayerReference,
    font: &printpdf::IndirectFontRef,
    size: f32,
    center_x: f32,
    y: f32,
    text: &str,
    color: Color,
) {
    let width_estimate = text.chars().count() as f32 * size * 0.18;
    write_text(
        layer,
        font,
        size,
        (center_x - width_estimate / 2.0).max(0.0),
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

#[cfg(test)]
mod footer_visual_tests {
    use super::*;
    use std::io::BufWriter;
    use std::path::PathBuf;

    #[test]
    fn render_yasir_footer_spacing_pdf() {
        let (document, page_index, layer_index) =
            PdfDocument::new("Footer Spacing Test", Mm(148.0), Mm(210.0), "Layer 1");
        let page = document.get_page(page_index);
        let layer = page.get_layer(layer_index);
        let font_regular = document.add_builtin_font(BuiltinFont::Helvetica).unwrap();
        let font_bold = document.add_builtin_font(BuiltinFont::HelveticaBold).unwrap();

        let navy = rgb_color(30, 27, 110);
        let red = rgb_color(239, 24, 34);
        let border_grey = rgb_color(215, 218, 227);
        let left = 10.0_f32;
        let right = 138.0_f32;
        let totals_left = right - 62.0;

        // Yasir sample payment summary.
        let mut current_y = 120.0_f32;

        write_totals_row(
            &layer,
            &font_regular,
            &font_bold,
            totals_left,
            right,
            current_y,
            "Subtotal",
            &format_rupees(12900),
            navy.clone(),
            navy.clone(),
            navy.clone(),
        );
        current_y -= 5.5;

        write_totals_row(
            &layer,
            &font_regular,
            &font_bold,
            totals_left,
            right,
            current_y,
            "Discount",
            &format!("- {}", format_rupees(500)),
            red.clone(),
            red.clone(),
            navy.clone(),
        );
        current_y -= 5.5;

        write_totals_row(
            &layer,
            &font_regular,
            &font_bold,
            totals_left,
            right,
            current_y,
            "Grand Total",
            &format_rupees(12400),
            navy.clone(),
            navy.clone(),
            navy.clone(),
        );
        current_y -= 5.5;

        write_totals_row(
            &layer,
            &font_regular,
            &font_bold,
            totals_left,
            right,
            current_y,
            "Advance Paid",
            &format_rupees(2000),
            red.clone(),
            red.clone(),
            navy.clone(),
        );
        current_y -= 5.5;

        let pending_amount_y = current_y;
        write_totals_row(
            &layer,
            &font_regular,
            &font_bold,
            totals_left,
            right,
            pending_amount_y,
            "Pending Amount",
            &format_rupees(10400),
            red.clone(),
            red.clone(),
            navy.clone(),
        );
        let pending_bottom_y = pending_amount_y - 1.5;

        draw_final_invoice_footer(
            &layer,
            &font_bold,
            left,
            right,
            pending_bottom_y,
            navy,
            border_grey,
        );

        let separator_y = pending_bottom_y - 8.0;
        let thank_you_y = separator_y - 3.0;
        let address_y = thank_you_y - 3.0;
        assert!((separator_y - (pending_bottom_y - 8.0)).abs() < f32::EPSILON);
        assert!((thank_you_y - (separator_y - 3.0)).abs() < f32::EPSILON);
        assert!((address_y - (thank_you_y - 3.0)).abs() < f32::EPSILON);
        assert!(thank_you_y < separator_y);
        assert!(separator_y < pending_bottom_y);

        let out = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("target")
            .join("test-yasir-footer-spacing.pdf");
        if let Some(parent) = out.parent() {
            std::fs::create_dir_all(parent).unwrap();
        }
        let bytes = {
            let mut buffer = Vec::new();
            {
                let mut writer = BufWriter::new(&mut buffer);
                document.save(&mut writer).unwrap();
            }
            buffer
        };
        std::fs::write(&out, bytes).unwrap();
        assert!(out.exists());
    }
}
