# Product Specification

## Purpose

Meer Ilyas Invoice System is an offline Windows desktop application for manually creating branded invoices and saving them as PDFs to USB.

## Application flow

Splash → Login → Home → Create Invoice → Preview → Save PDF → Success

## Screens

1. Splash screen
2. Login
3. Home
4. Create New Invoice
5. Invoice Preview
6. Invoice Saved
7. Login error state
8. Discount-expanded state
9. Clear-form confirmation
10. USB-unavailable dialog

## Login

- One hardcoded username and password.
- No user database.
- Verify credentials through Tauri/Rust.
- Do not expose the password in frontend code.
- Ask the user for final credentials before implementing authentication.

## Home

Show:

- Welcome message
- Generate New Invoice button
- Selected USB folder
- Select/Change USB Folder button
- Open Folder button
- Logout
- Shop footer

Do not add dashboard statistics or history.

## Invoice form

Customer fields:

- Customer Name: required
- Phone Number: required

Product rows:

- Product Name: manual text
- Quantity: positive number, default 1
- Unit Price: PKR
- Line Total: calculated
- Add Product Row
- Remove Product Row

No saved customers or products.

## Calculations

```text
Line Total = Quantity × Unit Price
Subtotal = Sum of line totals
Grand Total = Subtotal - Discount
Pending = Grand Total - Advance

Discount:

Optional
Default: none
Fixed PKR 
Only one type at a time
Cannot exceed subtotal

Advance:

Default: zero
Cannot exceed Grand Total
Pending cannot be negative
PDF
Use the approved A5 Meer Ilyas invoice template.
Show customer, products, totals, discount, advance and pending.
Save to selected USB folder.
Never overwrite an existing PDF.
Preserve form data when saving fails.
Excluded features
Database
Inventory and stock
Saved customers/products
Invoice history
Reports and analytics
Payments and payment methods
Taxes and delivery charges
Returns and refunds
Cloud or online features