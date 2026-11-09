import { normalizeTrade } from "./tradeCalculator.js";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatTime(value) {
  if (!value) return "";
  const text = String(value);
  return text.length >= 5 ? text.slice(0, 5) : text;
}

export function screenshotFromRow(row) {
  if (!row?.screenshot_path) return null;
  return {
    path: String(row.screenshot_path),
    id: String(row.screenshot_path),
    name: String(row.screenshot_path.split("/").pop() || "screenshot"),
    type: "",
    size: 0,
  };
}

export function mapRowToTrade(row) {
  if (!row) return null;

  return normalizeTrade({
    id: String(row.id),
    userId: row.user_id || null,
    date: String(row.trade_date),
    time: formatTime(row.trade_time),
    instrument: String(row.instrument || "").trim(),
    direction: row.direction,
    entryPrice: toNumber(row.entry_price),
    exitPrice: toNumber(row.exit_price),
    quantity: toNumber(row.quantity),
    profitLoss: toNumber(row.profit_loss),
    result: row.result,
    screenshot: screenshotFromRow(row),
    notes: row.notes ? String(row.notes) : "",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  });
}

export function mapTradeToRow(trade, userId) {
  const normalized = normalizeTrade(trade);
  return {
    user_id: userId,
    trade_date: normalized.date,
    trade_time: normalized.time ? normalized.time : null,
    instrument: normalized.instrument,
    direction: normalized.direction,
    entry_price: normalized.entryPrice,
    exit_price: normalized.exitPrice,
    quantity: normalized.quantity,
    profit_loss: normalized.profitLoss,
    result: normalized.result,
    screenshot_path: trade.screenshot?.path || null,
    notes: normalized.notes || null,
  };
}

export function hasScreenshot(screenshot) {
  return Boolean(screenshot?.path || screenshot?.id);
}

export function screenshotStoragePath(screenshot) {
  return screenshot?.path || null;
}
