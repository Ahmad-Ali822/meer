## 4. `docs/TECHNICAL_SPEC.md`

```md
# Technical Specification

## Stack

- Tauri v2
- React
- TypeScript strict mode
- Vite
- Tauri dialog, filesystem, path and opener plugins
- Suitable A5 PDF library
- Vitest and React Testing Library
- No backend server or database

## Architecture

Keep these concerns separate:

```text
UI components
→ Form/state hooks
→ Calculation and validation functions
→ Typed Tauri services
→ Rust/Tauri filesystem commands

Do not put calculations or filesystem logic directly inside JSX.

Money
Store PKR amounts as integer rupees.
Never use floating-point arithmetic for money.
Quantity may be decimal.
Use one calculation function for form, preview and PDF.
Local settings

A small JSON file may store:

{
  "selectedInvoiceDirectory": "E:\\Meer Ilyas Invoices",
  "year": 2026,
  "lastSuccessfulSequence": 25
}

This is configuration, not a database.

Invoice numbering

Format:

MI-2026-0001

The next number is determined from the highest value in:

Local settings JSON
USB invoice-sequence.json
Existing matching PDF filenames

Restart numbering from 0001 each year.

Finalize the number only after the PDF saves successfully.

Filename

Example:

MI-2026-0001-Ali-Raza.pdf

Sanitize Windows-invalid characters. Never overwrite an existing PDF.

USB behaviour
Select folder using native Windows folder dialog.
Verify folder before every save.
Block saving when USB is unavailable.
Do not silently save elsewhere.
Keep invoice data after failure.
Save metadata atomically.
Authentication
Verify hardcoded credentials in Rust/Tauri.
Store a password hash, not plain password.
Authentication lasts for the current application session.
Do not log credentials or customer information.