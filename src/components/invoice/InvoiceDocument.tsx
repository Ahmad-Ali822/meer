import type { InvoiceCalculationResult, InvoiceFormState } from "../../types/invoice";
import logo from "../../assets/Logo.jpeg";
import {
  formatDiscountLabel,
  formatInvoiceDate,
  formatQuantityDisplay,
  getAdvancePaidRupees,
} from "../../utils/invoiceDisplay";
import { formatRupees, parseRupeesInput } from "../../utils/money";

interface InvoiceDocumentProps {
  form: InvoiceFormState;
  totals: InvoiceCalculationResult;
  invoiceNumber: string;
  invoiceDate?: Date;
}

export function InvoiceDocument({
  form,
  totals,
  invoiceNumber,
  invoiceDate = new Date(),
}: InvoiceDocumentProps) {
  const discountLabel = formatDiscountLabel(form.discountType, form.discountValue);
  const advancePaidRupees = getAdvancePaidRupees(form);

  return (
    <article className="relative mx-auto flex min-h-[720px] w-full max-w-[540px] flex-col overflow-hidden border border-gray-200 bg-white py-8 pl-10 pr-8 font-sans text-[#1E1B6E] shadow-lg">
      {/* Left Dual-Color Vertical Bar */}
      <div className="absolute bottom-0 left-0 top-0 flex w-2.5 flex-col">
        <div className="h-[60%] bg-[#1E1B6E]" />
        <div className="h-[40%] bg-[#EF1822]" />
      </div>

      <div className="flex-1">
        {/* Header: Logo & INVOICE */}
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start">
            <img
              src={logo}
              alt="Meer Ilyas Logo"
              className="-mt-1 h-20 w-auto max-w-[200px] object-contain object-top"
            />
          </div>

          <div className="pt-0 text-right">
            <h1 className="text-3xl font-black tracking-wider text-[#1E1B6E]">
              INVOICE
            </h1>
            <div className="ml-auto mt-1.5 h-1.5 w-36 rounded-full bg-[#EF1822]" />
          </div>
        </header>

        {/* Invoice No. & Date Banner */}
        <div className="relative mb-6 flex items-center justify-between rounded-md bg-[#F3F4F8] py-2.5 px-4 text-xs font-bold text-[#1E1B6E]">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F4B51C] rounded-l-md" />
          <div className="flex items-center gap-2 pl-2">
            <span>Invoice No.</span>
            <span className="font-semibold text-gray-800">{invoiceNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Date</span>
            <span className="font-semibold text-gray-800">
              {formatInvoiceDate(invoiceDate)}
            </span>
          </div>
        </div>

        {/* BILL TO Section */}
        <section className="mb-6">
          <h2 className="text-sm font-extrabold text-[#EF1822] uppercase tracking-wider mb-1">
            BILL TO
          </h2>
          <div className="h-0.5 w-full bg-[#1E1B6E] mb-3" />
          <div className="grid grid-cols-2 gap-4 text-xs font-bold text-[#1E1B6E]">
            <div className="flex items-center gap-2">
              <span className="shrink-0">Customer Name</span>
              <span className="font-semibold text-gray-800 truncate border-b border-gray-300 flex-1 pb-0.5">
                {form.customerName || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0">Phone</span>
              <span className="font-semibold text-gray-800 truncate border-b border-gray-300 flex-1 pb-0.5">
                {form.phoneNumber || "—"}
              </span>
            </div>
          </div>
        </section>

        {/* Product Table */}
        <div className="mb-6 overflow-hidden rounded-md border border-[#D7DAE3]">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#1E1B6E] text-white text-[10px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-2 text-center w-10 border-r border-[#2C2885]">#</th>
                <th className="py-2.5 px-3 text-left border-r border-[#2C2885]">PRODUCT</th>
                <th className="py-2.5 px-2 text-center w-16 border-r border-[#2C2885]">QTY</th>
                <th className="py-2.5 px-3 text-right w-28 border-r border-[#2C2885]">
                  UNIT PRICE <br /> (PKR)
                </th>
                <th className="py-2.5 px-3 text-right w-28">
                  AMOUNT <br /> (PKR)
                </th>
              </tr>
            </thead>
            <tbody>
              {form.products.map((product, index) => {
                const isEven = index % 2 === 1;
                return (
                  <tr
                    key={product.id}
                    className={`border-b border-[#E2E5EC] ${
                      isEven ? "bg-[#F8F9FC]" : "bg-white"
                    }`}
                  >
                    <td className="py-2.5 px-2 text-center font-medium text-gray-500 border-r border-[#E2E5EC]">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 text-left font-semibold text-gray-800 border-r border-[#E2E5EC] break-words">
                      {product.productName || "—"}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-gray-800 border-r border-[#E2E5EC]">
                      {formatQuantityDisplay(product.quantity)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-800 border-r border-[#E2E5EC]">
                      {parseRupeesInput(product.unitPrice).toLocaleString("en-PK")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                      {(totals.lineTotalsRupees[index] ?? 0).toLocaleString("en-PK")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <section className="ml-auto w-full max-w-[260px] space-y-2 text-xs text-black">
          <div className="flex items-center justify-between pt-1 text-sm">
            <span>Subtotal</span>
            <span className="min-w-[100px] border-b border-black pb-0.5 text-right font-bold text-black">
              {formatRupees(totals.subtotalRupees)}
            </span>
          </div>

          {discountLabel && totals.discountAmountRupees > 0 ? (
            <div className="flex items-center justify-between text-black">
              <span>{discountLabel}</span>
              <span className="min-w-[100px] border-b border-black pb-0.5 text-right font-bold">
                - {formatRupees(totals.discountAmountRupees)}
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-1 text-sm">
            <span>Grand Total</span>
            <span className="min-w-[100px] border-b border-black pb-0.5 text-right font-bold text-black">
              {formatRupees(totals.grandTotalRupees)}
            </span>
          </div>

          {advancePaidRupees > 0 ? (
            <div className="flex items-center justify-between text-black">
              <span>Advance Paid</span>
              <span className="min-w-[100px] border-b border-black pb-0.5 text-right font-bold">
                {formatRupees(advancePaidRupees)}
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-1 text-sm text-black">
            <span>Pending Amount</span>
            <span className="min-w-[100px] border-b border-black pb-0.5 text-right font-bold">
              {formatRupees(totals.pendingRupees)}
            </span>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-4 border-t border-gray-200 pt-3 text-center text-[#1E1B6E]">
        <p className="text-xs font-bold tracking-wide">
          Thank you for shopping with us!
        </p>
        <p className="mt-1 text-[11px] font-medium">
          Shop # 5,Gap Choek Bakhtywala - 34 Muslim Road Gujranwala
        </p>
      </footer>
    </article>
  );
}
