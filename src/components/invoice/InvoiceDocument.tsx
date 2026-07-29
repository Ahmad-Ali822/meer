import type { InvoiceCalculationResult, InvoiceFormState } from "../../types/invoice";
import { PLACEHOLDER_INVOICE_NUMBER } from "../../types/invoice";
import { APP_SUBTITLE } from "../../theme/brand";
import {
  formatDiscountLabel,
  formatInvoiceDate,
  formatQuantityDisplay,
  getAdvancePaidRupees,
} from "../../utils/invoiceDisplay";
import { formatRupees } from "../../utils/money";
import { parseRupeesInput } from "../../utils/money";

interface InvoiceDocumentProps {
  form: InvoiceFormState;
  totals: InvoiceCalculationResult;
  invoiceDate?: Date;
}

export function InvoiceDocument({
  form,
  totals,
  invoiceDate = new Date(),
}: InvoiceDocumentProps) {
  const discountLabel = formatDiscountLabel(form.discountType, form.discountValue);
  const advancePaidRupees = getAdvancePaidRupees(form);

  return (
    <article className="mx-auto w-full max-w-[420px] bg-white px-8 py-7 text-brand-text shadow-md">
      <header className="mb-5 flex items-start justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-lg font-bold text-brand-navy">MEER ILYAS</h1>
          <p className="text-[10px] font-semibold tracking-wide text-brand-navy">
            {APP_SUBTITLE.toUpperCase()}
          </p>
          <p className="mt-2 text-[10px] leading-relaxed text-brand-muted">
            Main Market, Sector G-9/4,
            <br />
            Islamabad, Pakistan
          </p>
          <p className="mt-1 text-[10px] text-brand-muted">Ph: +92 51 1234567</p>
        </div>

        <div className="text-right">
          <p className="text-base font-bold text-brand-navy">INVOICE</p>
          <p className="mt-1 text-xs font-semibold text-brand-navy">
            # {PLACEHOLDER_INVOICE_NUMBER}
          </p>
          <p className="mt-1 text-[10px] text-brand-muted">
            Date: {formatInvoiceDate(invoiceDate)}
          </p>
        </div>
      </header>

      <section className="mb-4 rounded-md bg-brand-bg px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <p>
            <span className="font-semibold text-brand-muted">BILL TO:</span>{" "}
            <span className="font-bold text-brand-text">{form.customerName}</span>
          </p>
          <p>
            <span className="font-semibold text-brand-muted">CONTACT:</span>{" "}
            <span className="font-bold text-brand-text">{form.phoneNumber}</span>
          </p>
        </div>
      </section>

      <table className="mb-4 w-full border-collapse text-xs">
        <thead>
          <tr className="bg-[#eef0fb] text-[10px] font-semibold tracking-wide text-brand-muted">
            <th className="px-2 py-2 text-left">ITEM DESCRIPTION</th>
            <th className="px-2 py-2 text-center">QTY</th>
            <th className="px-2 py-2 text-right">PRICE</th>
            <th className="px-2 py-2 text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {form.products.map((product, index) => (
            <tr key={product.id} className="border-b border-brand-border/70">
              <td className="px-2 py-2.5 font-medium text-brand-text">
                {product.productName}
              </td>
              <td className="px-2 py-2.5 text-center text-brand-text">
                {formatQuantityDisplay(product.quantity)}
              </td>
              <td className="px-2 py-2.5 text-right text-brand-text">
                {parseRupeesInput(product.unitPrice).toLocaleString("en-PK")}
              </td>
              <td className="px-2 py-2.5 text-right font-semibold text-brand-text">
                {(totals.lineTotalsRupees[index] ?? 0).toLocaleString("en-PK")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="ml-auto w-full max-w-[220px] space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-brand-muted">Subtotal</span>
          <span className="font-medium">{formatRupees(totals.subtotalRupees)}</span>
        </div>

        {discountLabel && totals.discountAmountRupees > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-brand-muted">{discountLabel}</span>
            <span className="font-medium text-brand-red">
              - {formatRupees(totals.discountAmountRupees)}
            </span>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-brand-border pt-1.5">
          <span className="font-semibold text-brand-navy">Grand Total</span>
          <span className="text-sm font-bold text-brand-navy">
            {formatRupees(totals.grandTotalRupees)}
          </span>
        </div>

        {advancePaidRupees > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-brand-muted">Advance Paid</span>
            <span className="font-medium text-brand-red">
              {formatRupees(advancePaidRupees)}
            </span>
          </div>
        ) : null}

        <div className="rounded-md bg-[#fdecec] px-3 py-2">
          <div className="flex items-center justify-between font-bold text-brand-red">
            <span>Pending Amount</span>
            <span>{formatRupees(totals.pendingRupees)}</span>
          </div>
        </div>
      </section>
    </article>
  );
}
