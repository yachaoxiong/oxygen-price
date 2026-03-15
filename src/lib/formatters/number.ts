export function asNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function formatMoney(value?: number) {
  if (typeof value !== "number") return "-";
  return `$${value.toLocaleString()}`;
}

export function formatMoneyWithDecimals(value?: number, decimals = 2) {
  if (typeof value !== "number") return "-";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatPercent(value?: number) {
  if (typeof value !== "number") return "-";
  return `${value.toFixed(0)}%`;
}
