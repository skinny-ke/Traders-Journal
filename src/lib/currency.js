// Currency configuration for the Trade Journal.
// Change DEFAULT_CURRENCY here to match the trader's account currency.
// All P/L and price values are formatted using this currency.

export const DEFAULT_CURRENCY = "USD";

export const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
  JPY: "\u00A5",
};

export function currencySymbol(currency = DEFAULT_CURRENCY) {
  return CURRENCY_SYMBOLS[currency] || `${currency} `;
}

export function formatMoney(amount, currency = DEFAULT_CURRENCY) {
  const value = Number(amount);
  if (Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
