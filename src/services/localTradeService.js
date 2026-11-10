import {
  loadTrades,
  saveTrades,
  saveScreenshot,
  deleteScreenshot,
  clearTradeRecords,
  clearAllScreenshots,
  MAX_SCREENSHOT_SIZE,
} from "../lib/storage.js";
import { normalizeTrade } from "../lib/tradeCalculator.js";
import { groupTradesByDate, sortTradesNewestFirst } from "../lib/tradeStats.js";
import { ALLOWED_IMAGE_TYPES } from "../lib/constants.js";

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `trade_${crypto.randomUUID()}`;
  }
  return `trade_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowISO() {
  return new Date().toISOString();
}

function matchesFilters(trade, filters = {}) {
  const q = String(filters.instrument || "").trim().toLowerCase();
  if (q && !String(trade.instrument || "").toLowerCase().includes(q)) return false;
  if (filters.date && trade.date !== filters.date) return false;
  if (filters.dateFrom && trade.date < filters.dateFrom) return false;
  if (filters.dateTo && trade.date > filters.dateTo) return false;
  if (filters.direction && trade.direction !== filters.direction) return false;
  if (filters.result && trade.result !== filters.result) return false;
  return true;
}

async function persistScreenshot(tradeId, screenshotFile) {
  if (!screenshotFile) return null;
  if (!ALLOWED_IMAGE_TYPES.includes(screenshotFile.type) && screenshotFile.type !== "image/jpg") {
    throw new Error("Unsupported image type. Use PNG, JPG, or WEBP.");
  }
  if (screenshotFile.size > MAX_SCREENSHOT_SIZE) {
    throw new Error("Screenshot file too large (max 5 MB).");
  }
  await saveScreenshot(tradeId, screenshotFile);
  return {
    id: tradeId,
    path: tradeId,
    name: screenshotFile.name,
    type: screenshotFile.type,
    size: screenshotFile.size,
  };
}

export async function getTrades(filters = {}) {
  const trades = sortTradesNewestFirst(loadTrades()).filter((trade) => matchesFilters(trade, filters));
  if (filters.sortBy === "pnl") {
    trades.sort((a, b) => Number(a.profitLoss || 0) - Number(b.profitLoss || 0));
    if (filters.sortDir !== "asc") trades.reverse();
  }
  return trades;
}

export async function getTradeById(id) {
  return loadTrades().find((t) => t.id === id) || null;
}

export async function createTrade(input, screenshotFile) {
  const id = generateId();
  const createdAt = nowISO();
  const screenshot = await persistScreenshot(id, screenshotFile);

  const trade = normalizeTrade({
    id,
    date: input.date,
    time: input.time || "",
    instrument: input.instrument,
    direction: input.direction,
    entryPrice: Number(input.entryPrice),
    exitPrice: Number(input.exitPrice),
    quantity: Number(input.quantity),
    screenshot,
    notes: input.notes || "",
    createdAt,
    updatedAt: createdAt,
  });

  const trades = loadTrades();
  trades.push(trade);
  saveTrades(trades);
  return trade;
}

export async function updateTrade(id, input, screenshotFile) {
  const trades = loadTrades();
  const index = trades.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error("Trade not found.");
  }

  const existing = trades[index];
  let screenshot = existing.screenshot || null;

  if (screenshotFile) {
    if (existing.screenshot?.id) {
      await deleteScreenshot(existing.screenshot.id);
    }
    screenshot = await persistScreenshot(id, screenshotFile);
  } else if (input.removeScreenshot === true && existing.screenshot?.id) {
    await deleteScreenshot(existing.screenshot.id);
    screenshot = null;
  }

  const updated = normalizeTrade({
    ...existing,
    date: input.date ?? existing.date,
    time: input.time ?? existing.time,
    instrument: input.instrument ?? existing.instrument,
    direction: input.direction ?? existing.direction,
    entryPrice: input.entryPrice !== undefined ? Number(input.entryPrice) : existing.entryPrice,
    exitPrice: input.exitPrice !== undefined ? Number(input.exitPrice) : existing.exitPrice,
    quantity: input.quantity !== undefined ? Number(input.quantity) : existing.quantity,
    screenshot,
    notes: input.notes ?? existing.notes,
    createdAt: existing.createdAt,
    updatedAt: nowISO(),
  });

  trades[index] = updated;
  saveTrades(trades);
  return updated;
}

export async function deleteTrade(id) {
  const trades = loadTrades();
  const index = trades.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error("Trade not found.");
  }

  const [trade] = trades.splice(index, 1);
  saveTrades(trades);

  if (trade?.screenshot?.id) {
    try {
      await deleteScreenshot(trade.screenshot.id);
    } catch {
      // screenshot cleanup is best-effort; trade record is already removed
    }
  }

  return trade;
}

export async function getTradesByDate(date) {
  const trades = await getTrades({ date });
  return groupTradesByDate(trades)[date] || { trades: [], totalPnL: 0, tradeCount: 0, result: "BREAKEVEN" };
}

export async function getTradesByDateRange(startDate, endDate) {
  return getTrades({ dateFrom: startDate, dateTo: endDate });
}

export async function clearTrades() {
  clearTradeRecords();
  await clearAllScreenshots();
}

// Recycle Bin operations require Supabase cloud mode
export async function getDeletedTrades() {
  throw new Error("Recycle Bin is only available when signed in to Supabase.");
}
export async function restoreTrade() {
  throw new Error("Restore is only available when signed in to Supabase.");
}
export async function permanentlyDeleteTrade() {
  throw new Error("Permanent delete is only available when signed in to Supabase.");
}
export async function emptyRecycleBin() {
  throw new Error("Empty Recycle Bin is only available when signed in to Supabase.");
}
