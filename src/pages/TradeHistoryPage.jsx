import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrades } from "../hooks/useTrades.js";
import { getTrades as fetchFilteredTrades } from "../services/tradeService.js";
import { useToast } from "../context/ToastContext.jsx";
import { toUserError } from "../lib/errors.js";
import TradeTable from "../components/trades/TradeTable.jsx";
import TradeFilters from "../components/trades/TradeFilters.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ProfitLossDisplay from "../components/ui/ProfitLossDisplay.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";

export default function TradeHistoryPage() {
  const navigate = useNavigate();
  const { trades, removeTrade, loading, error, backend } = useTrades();
  const { success, error: showError } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [cloudRows, setCloudRows] = useState(null);

  const localFilteredTrades = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = trades.filter((trade) => {
      if (q && !String(trade.instrument || "").toLowerCase().includes(q)) return false;
      if (dateFrom && trade.date < dateFrom) return false;
      if (dateTo && trade.date > dateTo) return false;
      if (directionFilter && trade.direction !== directionFilter) return false;
      if (resultFilter && trade.result !== resultFilter) return false;
      return true;
    });

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "pnl") {
        comparison = Number(a.profitLoss || 0) - Number(b.profitLoss || 0);
      } else {
        const aKey = `${a.date || ""}T${a.time || "00:00"}|${a.createdAt || ""}`;
        const bKey = `${b.date || ""}T${b.time || "00:00"}|${b.createdAt || ""}`;
        comparison = aKey.localeCompare(bKey);
      }
      return sortDir === "asc" ? comparison : -comparison;
    });

    return list;
  }, [trades, searchQuery, dateFrom, dateTo, directionFilter, resultFilter, sortBy, sortDir]);

  useEffect(() => {
    if (backend?.mode !== "cloud") {
      setCloudRows(null);
      return undefined;
    }

    let cancelled = false;
    fetchFilteredTrades({
      instrument: searchQuery,
      dateFrom,
      dateTo,
      direction: directionFilter,
      result: resultFilter,
      sortBy,
      sortDir,
    })
      .then((rows) => {
        if (!cancelled) setCloudRows(rows);
      })
      .catch(() => {
        if (!cancelled) setCloudRows(null);
      });

    return () => {
      cancelled = true;
    };
  }, [backend?.mode, searchQuery, dateFrom, dateTo, directionFilter, resultFilter, sortBy, sortDir, trades]);

  const filteredTrades = cloudRows || localFilteredTrades;

  const handleDelete = async (id) => {
    try {
      await removeTrade(id);
      success("Trade moved to Recycle Bin.", 3000);
    } catch (err) {
      showError(toUserError(err, "Failed to delete trade."), 4000);
      throw err;
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setDirectionFilter("");
    setResultFilter("");
    setSortBy("date");
    setSortDir("desc");
  };

  const totalPnL = Math.round(filteredTrades.reduce((sum, t) => sum + Number(t.profitLoss || 0), 0) * 100) / 100;

  if (loading) return <LoadingState message="Loading trades…" />;

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-tj-loss">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-tj-primary tracking-tight">Trade History</h1>
          <p className="text-tj-secondary text-sm mt-1">View, filter, edit, and delete recorded trades.</p>
        </div>
      </div>

      <TradeFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        directionFilter={directionFilter}
        setDirectionFilter={setDirectionFilter}
        resultFilter={resultFilter}
        setResultFilter={setResultFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDir={sortDir}
        setSortDir={setSortDir}
        onClear={clearFilters}
      />

      {filteredTrades.length === 0 ? (
        <EmptyState
          title={trades.length === 0 ? "No trades recorded yet" : "No trades match your filters"}
          description={
            trades.length === 0
              ? "Start by adding your first trade."
              : "Try adjusting or clearing filters to see more results."
          }
          action={() => (trades.length === 0 ? navigate("/add-trade") : clearFilters())}
          actionLabel={trades.length === 0 ? "Add Trade" : "Clear filters"}
          icon="📭"
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm font-semibold text-tj-primary">
              {filteredTrades.length} trade{filteredTrades.length !== 1 ? "s" : ""}
            </div>
            <div className="text-xs text-tj-secondary flex items-center gap-1.5">
              <span>Filtered P/L:</span>
              <ProfitLossDisplay amount={totalPnL} showSign className="ml-1" />
            </div>
          </div>

          <TradeTable
            trades={filteredTrades}
            onView={(id) => navigate(`/trades/${id}`)}
            onEdit={(id) => navigate(`/trades/${id}/edit`)}
            onDelete={handleDelete}
            showActions
          />
        </>
      )}
    </div>
  );
}
