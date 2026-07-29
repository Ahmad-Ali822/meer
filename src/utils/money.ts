export function parseRupeesInput(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) {
    return 0;
  }

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed);
}

export function parseQuantityInput(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) {
    return 0;
  }

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return parsed;
}

export function parsePercentageInput(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) {
    return 0;
  }

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

export function formatRupees(amountRupees: number): string {
  return `Rs. ${amountRupees.toLocaleString("en-PK")}`;
}

export function formatDecimalAmount(amount: number): string {
  return amount.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
