import type { InvoiceFormErrors, ProductRow } from "../../types/invoice";
import { formatDecimalAmount } from "../../utils/money";

interface ProductRowsTableProps {
  products: ProductRow[];
  lineTotalsRupees: number[];
  errors: InvoiceFormErrors | null;
  onProductChange: (
    productId: string,
    field: "productName" | "quantity" | "unitPrice",
    value: string,
  ) => void;
  onAddRow: () => void;
  onRemoveRow: (productId: string) => void;
  onFieldBlur: () => void;
}

export function ProductRowsTable({
  products,
  lineTotalsRupees,
  errors,
  onProductChange,
  onAddRow,
  onRemoveRow,
  onFieldBlur,
}: ProductRowsTableProps) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <CartIcon />
        <h2 className="text-sm font-bold text-brand-navy">Products & Services</h2>
      </div>

      <div className="overflow-hidden rounded-lg border border-brand-border">
        <div className="grid grid-cols-[minmax(0,1fr)_88px_128px_128px_40px] gap-3 bg-[#eef0fb] px-3 py-2 text-[10px] font-semibold tracking-wider text-brand-muted">
          <span>PRODUCT NAME</span>
          <span>QTY</span>
          <span>UNIT PRICE (PKR)</span>
          <span>LINE TOTAL (PKR)</span>
          <span className="sr-only">Actions</span>
        </div>

        <div className="divide-y divide-brand-border">
          {products.map((product, index) => {
            const rowErrors = errors?.products[product.id];

            return (
              <div
                key={product.id}
                className="grid grid-cols-[minmax(0,1fr)_88px_128px_128px_40px] items-start gap-3 px-3 py-3"
              >
                <div>
                  <input
                    value={product.productName}
                    onChange={(event) =>
                      onProductChange(product.id, "productName", event.target.value)
                    }
                    onBlur={onFieldBlur}
                    placeholder="Description of service/item"
                    className={[
                      "w-full rounded-lg border bg-white px-3 py-2 text-sm text-brand-text",
                      "placeholder:text-brand-muted/70",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20 focus-visible:border-brand-navy",
                      rowErrors?.productName ? "border-brand-error" : "border-brand-border",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  {rowErrors?.productName ? (
                    <p className="mt-1 text-xs text-brand-error">
                      {rowErrors.productName}
                    </p>
                  ) : null}
                </div>

                <div>
                  <input
                    value={product.quantity}
                    onChange={(event) =>
                      onProductChange(product.id, "quantity", event.target.value)
                    }
                    onBlur={onFieldBlur}
                    inputMode="decimal"
                    className={[
                      "w-full rounded-lg border bg-white px-3 py-2 text-sm text-brand-text",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20 focus-visible:border-brand-navy",
                      rowErrors?.quantity ? "border-brand-error" : "border-brand-border",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  {rowErrors?.quantity ? (
                    <p className="mt-1 text-xs text-brand-error">
                      {rowErrors.quantity}
                    </p>
                  ) : null}
                </div>

                <div>
                  <input
                    value={product.unitPrice}
                    onChange={(event) =>
                      onProductChange(product.id, "unitPrice", event.target.value)
                    }
                    onBlur={onFieldBlur}
                    inputMode="decimal"
                    placeholder="0.00"
                    className={[
                      "w-full rounded-lg border bg-white px-3 py-2 text-sm text-brand-text",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20 focus-visible:border-brand-navy",
                      rowErrors?.unitPrice ? "border-brand-error" : "border-brand-border",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  {rowErrors?.unitPrice ? (
                    <p className="mt-1 text-xs text-brand-error">
                      {rowErrors.unitPrice}
                    </p>
                  ) : null}
                </div>

                <div className="flex h-[42px] items-center px-1 text-sm font-semibold text-brand-text">
                  {formatDecimalAmount(lineTotalsRupees[index] ?? 0)}
                </div>

                <div className="flex h-[42px] items-center justify-center">
                  <button
                    type="button"
                    aria-label="Remove product row"
                    disabled={products.length <= 1}
                    onClick={() => onRemoveRow(product.id)}
                    className="rounded p-1 text-brand-muted transition-colors hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/20 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <RemoveIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onAddRow}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-brand-border bg-white px-4 py-3 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/20"
      >
        <PlusIcon />
        Add Product Row
      </button>
    </section>
  );
}

function CartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-brand-navy"
      aria-hidden="true"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="12" x2="12" y1="5" y2="19" />
      <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
  );
}
