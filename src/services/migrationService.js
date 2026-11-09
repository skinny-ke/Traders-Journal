import { loadTrades } from "../lib/storage.js";
import { getAuthSession, isSupabaseConfigured } from "../lib/supabaseClient.js";
import { AppError } from "../lib/errors.js";
import { getScreenshot } from "../lib/storage.js";
import { createTrade } from "./supabaseTradeService.js";

const MIGRATION_FLAG_KEY = "trade_journal_local_import_completed_ids";

export function getLocalTradeSnapshot() {
  const trades = loadTrades();
  return {
    count: trades.length,
    hasLocalData: trades.length > 0,
    trades,
  };
}

function readImportedIds() {
  try {
    const raw = localStorage.getItem(MIGRATION_FLAG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeImportedIds(ids) {
  localStorage.setItem(MIGRATION_FLAG_KEY, JSON.stringify([...ids]));
}

export async function getMigrationStatus() {
  const snapshot = getLocalTradeSnapshot();
  const importedIds = readImportedIds();
  const remaining = snapshot.trades.filter((trade) => !importedIds.has(trade.id));
  const session = await getAuthSession();

  return {
    ...snapshot,
    remainingCount: remaining.length,
    alreadyImportedCount: snapshot.count - remaining.length,
    canRun: Boolean(session && remaining.length > 0),
    deferredUntilAuth: false,
    reason: session
      ? remaining.length > 0
        ? "Local trades are available for import."
        : "All local trades have been imported."
      : "Sign in to import local trades into your cloud account.",
  };
}

export async function importLocalTradesToSupabase({ confirmed = false } = {}) {
  if (!confirmed) {
    throw new AppError("Import requires explicit confirmation.", { code: "NOT_CONFIRMED" });
  }
  if (!isSupabaseConfigured()) {
    throw new AppError("Configure Supabase before importing local trades.", { code: "NOT_CONFIGURED" });
  }

  const session = await getAuthSession();
  if (!session) {
    throw new AppError(
      "A signed-in user is required to import local trades into Supabase.",
      { code: "UNAUTHENTICATED" },
    );
  }

  const importedIds = readImportedIds();
  const localTrades = loadTrades().filter((trade) => !importedIds.has(trade.id));
  const report = { imported: [], failed: [], skipped: snapshotSkipped(importedIds) };

  for (const trade of localTrades) {
    try {
      let file = null;
      if (trade.screenshot?.id) {
        file = await getScreenshot(trade.screenshot.id);
      }
      const created = await createTrade(
        {
          date: trade.date,
          time: trade.time,
          instrument: trade.instrument,
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          quantity: trade.quantity,
          notes: trade.notes,
        },
        file,
      );
      importedIds.add(trade.id);
      report.imported.push({ localId: trade.id, cloudId: created.id });
    } catch (error) {
      report.failed.push({ localId: trade.id, message: error.message });
    }
  }

  writeImportedIds(importedIds);
  return report;
}

function snapshotSkipped(importedIds) {
  return loadTrades()
    .filter((trade) => importedIds.has(trade.id))
    .map((trade) => trade.id);
}
