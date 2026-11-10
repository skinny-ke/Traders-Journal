import { getAuthSession, getSupabaseConfigStatus, isSupabaseConfigured } from "../lib/supabaseClient.js";
import { groupTradesByDate } from "../lib/tradeStats.js";
import * as localTradeService from "./localTradeService.js";
import * as supabaseTradeService from "./supabaseTradeService.js";

export async function getBackendStatus() {
  const config = getSupabaseConfigStatus();
  if (!config.configured) {
    return {
      mode: "local",
      configured: false,
      authenticated: false,
      message:
        "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a local .env file. Until then, trades are stored in this browser only.",
    };
  }

  const session = await getAuthSession();
  if (!session) {
    return {
      mode: "local",
      configured: true,
      authenticated: false,
      message:
        "Supabase is configured, but there is no signed-in user. Cloud database and screenshot storage stay locked by Row Level Security until authentication is added. Local development data is still used.",
    };
  }

  return {
    mode: "cloud",
    configured: true,
    authenticated: true,
    message: "Connected to Supabase. Trades and screenshots are stored in your cloud account.",
  };
}

async function getSource() {
  const status = await getBackendStatus();
  return status.mode === "cloud" ? supabaseTradeService : localTradeService;
}

export async function getTrades(filters) {
  const source = await getSource();
  return source.getTrades(filters);
}

export async function getTradeById(id) {
  const source = await getSource();
  return source.getTradeById(id);
}

export async function createTrade(input, screenshotFile) {
  const source = await getSource();
  return source.createTrade(input, screenshotFile);
}

export async function updateTrade(id, updatedTrade, screenshotFile) {
  const source = await getSource();
  return source.updateTrade(id, updatedTrade, screenshotFile);
}

export async function deleteTrade(id) {
  const source = await getSource();
  return source.deleteTrade(id);
}

export async function getTradesByDate(date) {
  const source = await getSource();
  return source.getTradesByDate(date);
}

export async function getTradesByDateRange(startDate, endDate) {
  const source = await getSource();
  return source.getTradesByDateRange(startDate, endDate);
}

export async function clearTrades() {
  const source = await getSource();
  return source.clearTrades();
}

export async function getDeletedTrades() {
  const source = await getSource();
  if (!source.getDeletedTrades) throw new Error("Recycle Bin is only available when signed in to Supabase.");
  return source.getDeletedTrades();
}

export async function restoreTrade(id) {
  const source = await getSource();
  if (!source.restoreTrade) throw new Error("Restore is only available when signed in to Supabase.");
  return source.restoreTrade(id);
}

export async function permanentlyDeleteTrade(id) {
  const source = await getSource();
  if (!source.permanentlyDeleteTrade) throw new Error("Permanent delete is only available when signed in to Supabase.");
  return source.permanentlyDeleteTrade(id);
}

export async function emptyRecycleBin() {
  const source = await getSource();
  if (!source.emptyRecycleBin) throw new Error("Empty Recycle Bin is only available when signed in to Supabase.");
  return source.emptyRecycleBin();
}

export async function getTradesGroupedByDate(startDate, endDate) {
  const trades = startDate && endDate
    ? await getTradesByDateRange(startDate, endDate)
    : await getTrades();
  return groupTradesByDate(trades);
}

export { isSupabaseConfigured };
