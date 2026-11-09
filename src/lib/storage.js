import { DEFAULT_CURRENCY } from "./currency.js";
import { normalizeTrade } from "./tradeCalculator.js";

export const TRADES_STORAGE_KEY = "trade_journal_trades";
const SCREENSHOT_DB_NAME = "TradeJournalDB";
const SCREENSHOT_STORE_NAME = "screenshots";
const SCREENSHOT_DB_VERSION = 1;

export const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;
export { DEFAULT_CURRENCY };

const VALID_DIRECTIONS = new Set(["BUY", "SELL"]);

function sanitizeTrade(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (!raw.id || !raw.date || !raw.instrument) return null;

  const entryPrice = Number(raw.entryPrice);
  const exitPrice = Number(raw.exitPrice);
  const quantity = Number(raw.quantity);
  if (![entryPrice, exitPrice, quantity].every(Number.isFinite)) return null;
  if (entryPrice <= 0 || exitPrice <= 0 || quantity <= 0) return null;

  let direction = String(raw.direction || "").toUpperCase();
  if (direction === "BUY" || direction === "SELL") {
    // ok
  } else if (String(raw.direction) === "Buy") direction = "BUY";
  else if (String(raw.direction) === "Sell") direction = "SELL";
  if (!VALID_DIRECTIONS.has(direction)) direction = "BUY";

  return normalizeTrade({
    id: String(raw.id),
    date: String(raw.date),
    time: raw.time ? String(raw.time) : "",
    instrument: String(raw.instrument).trim(),
    direction,
    entryPrice,
    exitPrice,
    quantity,
    screenshot:
      raw.screenshot && typeof raw.screenshot === "object" && (raw.screenshot.id || raw.screenshot.path)
        ? {
            id: String(raw.screenshot.id || raw.screenshot.path),
            path: raw.screenshot.path ? String(raw.screenshot.path) : String(raw.screenshot.id),
            name: String(raw.screenshot.name || "screenshot"),
            type: String(raw.screenshot.type || "image/png"),
            size: Number(raw.screenshot.size) || 0,
          }
        : null,
    notes: raw.notes ? String(raw.notes) : "",
    createdAt: raw.createdAt ? String(raw.createdAt) : new Date().toISOString(),
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : raw.createdAt ? String(raw.createdAt) : new Date().toISOString(),
  });
}

export function loadTrades() {
  try {
    const raw = localStorage.getItem(TRADES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeTrade).filter(Boolean);
  } catch (err) {
    console.warn("Failed to load trades from localStorage", err);
    return [];
  }
}

export function saveTrades(trades) {
  try {
    localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
  } catch (err) {
    console.warn("Failed to save trades to localStorage", err);
    throw new Error("Unable to save trades. Storage may be full.");
  }
}

let dbPromise = null;

function getDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this environment."));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(SCREENSHOT_DB_NAME, SCREENSHOT_DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SCREENSHOT_STORE_NAME)) {
        db.createObjectStore(SCREENSHOT_STORE_NAME, { keyPath: "id" });
      }
    };
  });
  return dbPromise;
}

export async function saveScreenshot(id, file) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SCREENSHOT_STORE_NAME, "readwrite");
    const store = tx.objectStore(SCREENSHOT_STORE_NAME);
    const req = store.put({ id, file, name: file.name, type: file.type, size: file.size, savedAt: Date.now() });
    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error);
  });
}

export async function getScreenshot(id) {
  try {
    const db = await getDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(SCREENSHOT_STORE_NAME, "readonly");
      const store = tx.objectStore(SCREENSHOT_STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.file : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Failed to read screenshot from IndexedDB", err);
    return null;
  }
}

export async function deleteScreenshot(id) {
  try {
    const db = await getDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(SCREENSHOT_STORE_NAME, "readwrite");
      const store = tx.objectStore(SCREENSHOT_STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(id);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Failed to delete screenshot from IndexedDB", err);
    return id;
  }
}

export function clearTradeRecords() {
  try {
    localStorage.removeItem(TRADES_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear trades from localStorage", err);
  }
}

export async function clearAllScreenshots() {
  try {
    const db = await getDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(SCREENSHOT_STORE_NAME, "readwrite");
      const store = tx.objectStore(SCREENSHOT_STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Failed to clear screenshots from IndexedDB", err);
  }
}
