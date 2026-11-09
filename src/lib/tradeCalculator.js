import { DEFAULT_CURRENCY, formatMoney } from "./currency.js";

export function calculateProfitLoss(direction, entryPrice, exitPrice, quantity) {
  if (
    entryPrice === null ||
    entryPrice === undefined ||
    entryPrice === "" ||
    exitPrice === null ||
    exitPrice === undefined ||
    exitPrice === "" ||
    quantity === null ||
    quantity === undefined ||
    quantity === ""
  ) {
    return 0;
  }

  const entry = Number(entryPrice);
  const exit = Number(exitPrice);
  const qty = Number(quantity);

  if (![entry, exit, qty].every(Number.isFinite)) {
    return 0;
  }

  let pnl;
  if (String(direction).toUpperCase() === "SELL") {
    pnl = (entry - exit) * qty;
  } else {
    pnl = (exit - entry) * qty;
  }

  return Math.round(pnl * 100) / 100;
}

export function determineResult(profitLoss) {
  const pnl = Number(profitLoss);
  if (pnl > 0) return "WIN";
  if (pnl < 0) return "LOSS";
  return "BREAKEVEN";
}

export function normalizeDirection(direction) {
  const d = String(direction || "").toUpperCase();
  return d === "SELL" ? "SELL" : "BUY";
}

export function normalizeTrade(input) {
  const direction = normalizeDirection(input.direction);
  const entryPrice = Number(input.entryPrice);
  const exitPrice = Number(input.exitPrice);
  const quantity = Number(input.quantity);
  const profitLoss = calculateProfitLoss(direction, entryPrice, exitPrice, quantity);
  const result = determineResult(profitLoss);

  return {
    ...input,
    instrument: String(input.instrument || "").trim(),
    direction,
    entryPrice,
    exitPrice,
    quantity,
    profitLoss,
    result,
    notes: input.notes ?? "",
    time: input.time ?? "",
  };
}

export function formatCurrency(amount, currency = DEFAULT_CURRENCY) {
  return formatMoney(amount, currency);
}

export function formatPnL(amount, currency = DEFAULT_CURRENCY) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "-";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatMoney(value, currency)}`;
}
