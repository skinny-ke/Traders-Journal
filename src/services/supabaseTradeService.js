import { supabase, getCurrentUserId } from "../lib/supabaseClient.js";
import { AppError, logDiagnostic, toUserError } from "../lib/errors.js";
import { normalizeTrade } from "../lib/tradeCalculator.js";
import { mapRowToTrade, mapTradeToRow, screenshotStoragePath } from "../lib/tradeMapper.js";
import { groupTradesByDate, sortTradesNewestFirst } from "../lib/tradeStats.js";
import { deleteScreenshot, uploadScreenshot } from "./screenshotService.js";

const TRADE_COLUMNS =
  "id, user_id, trade_date, trade_time, instrument, direction, entry_price, exit_price, quantity, profit_loss, result, screenshot_path, notes, created_at, updated_at";

function requireClient() {
  if (!supabase) {
    throw new AppError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.", {
      code: "NOT_CONFIGURED",
    });
  }
  return supabase;
}

async function requireUserId() {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new AppError("Cloud storage requires a signed-in user. Authentication will be added in the next stage.", {
      code: "UNAUTHENTICATED",
    });
  }
  return userId;
}

function throwQueryError(error, fallback) {
  logDiagnostic("supabaseTradeService", error);
  throw new AppError(toUserError(error, fallback), { code: "SUPABASE_ERROR", cause: error });
}

function applyFilters(query, filters = {}) {
  let next = query;
  const instrument = String(filters.instrument || "").trim();
  if (instrument) next = next.ilike("instrument", `%${instrument}%`);
  if (filters.date) next = next.eq("trade_date", filters.date);
  if (filters.dateFrom) next = next.gte("trade_date", filters.dateFrom);
  if (filters.dateTo) next = next.lte("trade_date", filters.dateTo);
  if (filters.direction) next = next.eq("direction", filters.direction);
  if (filters.result) next = next.eq("result", filters.result);
  return next;
}

export async function getTrades(filters = {}) {
  const client = requireClient();
  await requireUserId();

  let query = client.from("trades").select(TRADE_COLUMNS);
  query = applyFilters(query, filters);

  if (filters.sortBy === "pnl") {
    query = query.order("profit_loss", { ascending: filters.sortDir === "asc" });
  } else {
    query = query.order("trade_date", { ascending: filters.sortDir === "asc" }).order("created_at", {
      ascending: filters.sortDir === "asc",
    });
  }

  const { data, error } = await query;
  if (error) throwQueryError(error, "Failed to retrieve trades.");
  const trades = (data || []).map(mapRowToTrade);
  if (filters.sortBy === "pnl") return trades;
  return filters.sortDir === "asc" ? trades : sortTradesNewestFirst(trades);
}

export async function getTradeById(id) {
  const client = requireClient();
  await requireUserId();

  const { data, error } = await client.from("trades").select(TRADE_COLUMNS).eq("id", id).maybeSingle();
  if (error) throwQueryError(error, "Failed to retrieve the trade.");
  return data ? mapRowToTrade(data) : null;
}

export async function createTrade(input, screenshotFile) {
  const client = requireClient();
  const userId = await requireUserId();

  const normalized = normalizeTrade({
    date: input.date,
    time: input.time || "",
    instrument: input.instrument,
    direction: input.direction,
    entryPrice: Number(input.entryPrice),
    exitPrice: Number(input.exitPrice),
    quantity: Number(input.quantity),
    notes: input.notes || "",
  });

  // Insert the trade first so we have the real UUID before storing a screenshot.
  // Screenshots live under {user_id}/{trade_id}/{filename}, so the trade id is
  // required for a consistent, ownership-scoped storage path.
  const row = mapTradeToRow(normalized, userId);
  const { data, error } = await client.from("trades").insert(row).select(TRADE_COLUMNS).single();
  if (error) throw error;
  const trade = mapRowToTrade(data);

  let screenshot = null;
  try {
    if (screenshotFile) {
      screenshot = await uploadScreenshot(screenshotFile, userId, trade.id);
      const { data: updatedData, error: updateError } = await client
        .from("trades")
        .update({ screenshot_path: screenshot.path })
        .eq("id", trade.id)
        .select(TRADE_COLUMNS)
        .single();
      if (updateError) throw updateError;
      return mapRowToTrade(updatedData);
    }

    return trade;
  } catch (error) {
    if (screenshot?.path) {
      try {
        await deleteScreenshot(screenshot.path);
      } catch (cleanupError) {
        logDiagnostic("createTrade.cleanupScreenshot", cleanupError);
      }
    }
    try {
      await client.from("trades").delete().eq("id", trade.id);
    } catch (rollbackError) {
      logDiagnostic("createTrade.rollbackTrade", rollbackError);
    }
    throwQueryError(error, "Failed to save the trade.");
  }
}

export async function updateTrade(id, input, screenshotFile) {
  const client = requireClient();
  const userId = await requireUserId();
  const existing = await getTradeById(id);
  if (!existing) {
    throw new AppError("Trade not found.", { code: "NOT_FOUND" });
  }

  const next = normalizeTrade({
    ...existing,
    date: input.date ?? existing.date,
    time: input.time ?? existing.time,
    instrument: input.instrument ?? existing.instrument,
    direction: input.direction ?? existing.direction,
    entryPrice: input.entryPrice !== undefined ? Number(input.entryPrice) : existing.entryPrice,
    exitPrice: input.exitPrice !== undefined ? Number(input.exitPrice) : existing.exitPrice,
    quantity: input.quantity !== undefined ? Number(input.quantity) : existing.quantity,
    notes: input.notes ?? existing.notes,
  });

  const previousPath = screenshotStoragePath(existing.screenshot);
  let uploaded = null;
  let screenshotPath = previousPath;

  try {
    if (screenshotFile) {
      uploaded = await uploadScreenshot(screenshotFile, userId, id);
      screenshotPath = uploaded.path;
    } else if (input.removeScreenshot === true) {
      screenshotPath = null;
    }

    next.screenshot = screenshotPath ? { path: screenshotPath, id: screenshotPath } : null;
    const row = mapTradeToRow(next, userId);
    delete row.user_id;

    const { data, error } = await client
      .from("trades")
      .update(row)
      .eq("id", id)
      .select(TRADE_COLUMNS)
      .single();
    if (error) throw error;

    if (screenshotFile && previousPath && previousPath !== screenshotPath) {
      try {
        await deleteScreenshot(previousPath);
      } catch (cleanupError) {
        logDiagnostic("updateTrade.deleteOldScreenshot", cleanupError);
      }
    } else if (input.removeScreenshot === true && previousPath) {
      try {
        await deleteScreenshot(previousPath);
      } catch (cleanupError) {
        logDiagnostic("updateTrade.removeScreenshot", cleanupError);
      }
    }

    return mapRowToTrade(data);
  } catch (error) {
    if (uploaded?.path) {
      try {
        await deleteScreenshot(uploaded.path);
      } catch (cleanupError) {
        logDiagnostic("updateTrade.cleanupNewScreenshot", cleanupError);
      }
    }
    throwQueryError(error, "Failed to update the trade.");
  }
}

export async function deleteTrade(id) {
  const existing = await getTradeById(id);
  if (!existing) {
    throw new AppError("Trade not found.", { code: "NOT_FOUND" });
  }

  const client = requireClient();
  const { error } = await client.from("trades").delete().eq("id", id);
  if (error) throwQueryError(error, "Failed to delete the trade.");

  const path = screenshotStoragePath(existing.screenshot);
  if (path) {
    try {
      await deleteScreenshot(path);
    } catch (cleanupError) {
      logDiagnostic("deleteTrade.screenshot", cleanupError);
      throw new AppError("The trade was deleted, but its screenshot could not be removed.", {
        code: "PARTIAL_DELETE",
        cause: cleanupError,
      });
    }
  }

  return existing;
}

export async function getTradesByDate(date) {
  const trades = await getTrades({ date });
  return groupTradesByDate(trades)[date] || { trades: [], totalPnL: 0, tradeCount: 0, result: "BREAKEVEN" };
}

export async function getTradesByDateRange(startDate, endDate) {
  return getTrades({ dateFrom: startDate, dateTo: endDate });
}

export async function clearTrades() {
  throw new AppError("Clearing all cloud trades is not available in this stage.", { code: "NOT_ALLOWED" });
}
