import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getTrades,
  getTradeById,
  createTrade,
  updateTrade,
  deleteTrade,
  getBackendStatus,
} from "../services/tradeService.js";
import { getMigrationStatus } from "../services/migrationService.js";
import { groupTradesByDate, sortTradesNewestFirst } from "../lib/tradeStats.js";
import { toUserError } from "../lib/errors.js";

const TradesContext = createContext(null);

export function TradesProvider({ children }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backend, setBackend] = useState({
    mode: "local",
    configured: false,
    authenticated: false,
    message: "Checking storage status...",
  });
  const [migration, setMigration] = useState({ hasLocalData: false, remainingCount: 0 });

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [status, list, migrationStatus] = await Promise.all([
        getBackendStatus(),
        getTrades(),
        getMigrationStatus(),
      ]);
      setBackend(status);
      setTrades(list);
      setMigration(migrationStatus);
    } catch (err) {
      setError(toUserError(err, "Failed to load trades."));
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addTrade = useCallback(async (input, screenshotFile) => {
    const newTrade = await createTrade(input, screenshotFile);
    setTrades((prev) => sortTradesNewestFirst([newTrade, ...prev.filter((t) => t.id !== newTrade.id)]));
    return newTrade;
  }, []);

  const editTrade = useCallback(async (id, input, screenshotFile) => {
    const updated = await updateTrade(id, input, screenshotFile);
    setTrades((prev) => sortTradesNewestFirst(prev.map((t) => (t.id === id ? updated : t))));
    return updated;
  }, []);

  const removeTrade = useCallback(async (id) => {
    await deleteTrade(id);
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTrade = useCallback(
    (id) => trades.find((t) => t.id === id) || null,
    [trades],
  );

  const loadTrade = useCallback(
    async (id) => {
      const cached = trades.find((t) => t.id === id);
      if (cached) return cached;
      return getTradeById(id);
    },
    [trades],
  );

  const tradesByDate = useMemo(() => groupTradesByDate(trades), [trades]);

  const value = useMemo(
    () => ({
      trades,
      loading,
      error,
      backend,
      migration,
      tradesByDate,
      addTrade,
      editTrade,
      removeTrade,
      getTrade,
      loadTrade,
      reload,
    }),
    [trades, loading, error, backend, migration, tradesByDate, addTrade, editTrade, removeTrade, getTrade, loadTrade, reload],
  );

  return <TradesContext.Provider value={value}>{children}</TradesContext.Provider>;
}

export function useTrades() {
  const ctx = useContext(TradesContext);
  if (!ctx) {
    throw new Error("useTrades must be used within a TradesProvider.");
  }
  return ctx;
}
