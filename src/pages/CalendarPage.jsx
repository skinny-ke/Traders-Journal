import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTrades } from "../hooks/useTrades.js";
import { getTradesByDateRange } from "../services/tradeService.js";
import { groupTradesByDate } from "../lib/tradeStats.js";
import CalendarGrid from "../components/calendar/CalendarGrid.jsx";
import ProfitLossDisplay from "../components/ui/ProfitLossDisplay.jsx";
import Badge from "../components/ui/Badge.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";
import { getDaysInMonth, toDateKey, todayDateKey } from "../lib/dates.js";

export default function CalendarPage() {
  const navigate = useNavigate();
  const { trades, loading, error } = useTrades();
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(todayDateKey());
  const [monthGroups, setMonthGroups] = useState({});
  const [monthError, setMonthError] = useState(null);

  const { year, month } = view;
  const daysInMonth = getDaysInMonth(year, month);
  const prevMonthDate = new Date(year, month - 1, 1);
  const nextMonthDate = new Date(year, month + 1, 1);
  const header = new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const tradesByDate = monthGroups;
  const selectedGroup = tradesByDate[selectedDate] || { trades: [], totalPnL: 0, tradeCount: 0, result: "BREAKEVEN" };
  const todayKey = todayDateKey();

  useEffect(() => {
    let cancelled = false;
    const start = toDateKey(year, month, 1);
    const end = toDateKey(year, month, daysInMonth);

    getTradesByDateRange(start, end)
      .then((rows) => {
        if (!cancelled) {
          setMonthGroups(groupTradesByDate(rows));
          setMonthError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setMonthError(err?.message || "Failed to load calendar trades.");
      });

    return () => {
      cancelled = true;
    };
  }, [year, month, daysInMonth, trades]);

  const monthStats = useMemo(() => {
    let pnl = 0;
    let count = 0;
    let activeDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const group = tradesByDate[toDateKey(year, month, day)];
      if (group && group.tradeCount > 0) {
        pnl = Math.round((pnl + group.totalPnL) * 100) / 100;
        count += group.tradeCount;
        activeDays += 1;
      }
    }
    return { pnl, count, activeDays };
  }, [tradesByDate, year, month, daysInMonth]);

  if (loading) return <LoadingState message="Loading calendar…" />;

  if (error || monthError) {
    return (
      <div className="py-16 text-center">
        <p className="text-tj-loss">{error || monthError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-tj-primary tracking-tight">Trading Calendar</h1>
        <p className="text-tj-secondary text-sm mt-1">
          Monthly view of combined daily P/L from actual trades. Click a day to view its trades.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-8 items-start">
        <div className="card">
          <div className="flex items-center justify-between mb-5 gap-3">
            <div>
              <h2 className="text-xl font-bold text-tj-primary">{header}</h2>
              <p className="text-xs text-tj-muted mt-1">
                {monthStats.activeDays} trading day{monthStats.activeDays !== 1 ? "s" : ""} · {monthStats.count} trade{monthStats.count !== 1 ? "s" : ""} ·{" "}
                <span className={monthStats.pnl > 0 ? "text-tj-profit" : monthStats.pnl < 0 ? "text-tj-loss" : "text-tj-secondary"}>
                  <ProfitLossDisplay amount={monthStats.pnl} showSign className="text-xs" />
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setView({ year: prevMonthDate.getFullYear(), month: prevMonthDate.getMonth() })}
                className="p-2.5 rounded-xl text-tj-muted hover:text-tj-primary hover:bg-tj-surface transition-colors duration-fast"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setView({ year: today.getFullYear(), month: today.getMonth() });
                  setSelectedDate(todayKey);
                }}
                className="px-3 py-1.5 rounded-xl text-xs text-tj-muted hover:text-tj-primary hover:bg-tj-surface transition-colors duration-fast"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setView({ year: nextMonthDate.getFullYear(), month: nextMonthDate.getMonth() })}
                className="p-2.5 rounded-xl text-tj-muted hover:text-tj-primary hover:bg-tj-surface transition-colors duration-fast"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <CalendarGrid
            year={year}
            month={month}
            tradesByDate={tradesByDate}
            selectedDate={selectedDate}
            todayKey={todayKey}
            onSelectDate={setSelectedDate}
          />

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <Legend color="bg-tj-profit-soft border-tj-profit/30" label="Profitable day" />
            <Legend color="bg-tj-loss-soft border-tj-loss/30" label="Losing day" />
            <Legend color="bg-tj-surface border-tj-light" label="Neutral / no trades" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xs font-semibold text-tj-muted uppercase tracking-wider">Selected Day</h2>
              <p className="text-sm font-bold text-tj-primary mt-0.5">{selectedDate}</p>
              <p className="text-xs text-tj-muted mt-0.5">{selectedGroup.tradeCount} trade{selectedGroup.tradeCount !== 1 ? "s" : ""}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-tj-muted">Daily P/L</p>
              <ProfitLossDisplay amount={selectedGroup.totalPnL} showSign className="text-financial-lg font-bold" />
            </div>
          </div>

          {selectedGroup.tradeCount === 0 ? (
            <p className="text-sm text-tj-secondary py-10 text-center">No trades recorded for this date.</p>
          ) : (
            <div className="space-y-2">
              {selectedGroup.trades.map((trade) => (
                <button
                  key={trade.id}
                  type="button"
                  onClick={() => navigate(`/trades/${trade.id}`)}
                  className="w-full text-left rounded-lg border border-tj-light/70 bg-tj-card/30 p-3 hover:border-tj-accent/50 hover:bg-tj-surface transition-colors duration-fast group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-tj-primary truncate">{trade.instrument}</p>
                      <p className="text-xs text-tj-muted">
                        {trade.time || "—"} · <span className={trade.direction === "BUY" ? "text-tj-accent" : "text-tj-primary"}> {trade.direction}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <ProfitLossDisplay amount={trade.profitLoss} showSign className="text-sm font-semibold" />
                      <div className="mt-1.5">
                        <Badge variant={trade.result === "WIN" ? "win" : trade.result === "LOSS" ? "loss" : "neutral"}>
                          {trade.result === "BREAKEVEN" ? "BE" : trade.result}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full border ${color}`} />
      <span className="text-tj-muted">{label}</span>
    </div>
  );
}
