import { useNavigate } from "react-router-dom";
import { useTrades } from "../hooks/useTrades.js";
import SummaryCard from "../components/dashboard/SummaryCard.jsx";
import RecentTrades from "../components/dashboard/RecentTrades.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Button from "../components/ui/Button.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";
import { formatPnL } from "../lib/tradeCalculator.js";
import { computeDashboardStats } from "../lib/tradeStats.js";
import { DEFAULT_CURRENCY } from "../lib/currency.js";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { trades, loading, error } = useTrades();

  if (loading) return <LoadingState message="Loading dashboard…" />;

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-tj-loss">{error}</p>
      </div>
    );
  }

  const stats = computeDashboardStats(trades);
  const isProfitable = stats.totalPnL > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-tj-primary tracking-tight">Dashboard</h1>
        <p className="text-tj-secondary text-sm mt-1">Overview of your trading performance.</p>
      </div>

      {stats.totalTrades === 0 ? (
        <EmptyState
          title="No trades recorded yet"
          description="Add your first trade to calculate performance statistics, recent activity, and calendar results."
          action={() => navigate("/add-trade")}
          actionLabel="Add Trade"
          icon="📊"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title={`Total P/L (${DEFAULT_CURRENCY})`}
              value={formatPnL(stats.totalPnL)}
              trend={isProfitable ? "up" : stats.totalPnL < 0 ? "down" : "neutral"}
              changeLabel="from recorded trades"
            />
            <SummaryCard title="Total Trades" value={String(stats.totalTrades)} />
            <SummaryCard title="Winning Trades" value={String(stats.winning)} trend="up" />
            <SummaryCard title="Losing Trades" value={String(stats.losing)} trend="down" />
            <SummaryCard title="Breakeven Trades" value={String(stats.breakeven)} trend="neutral" />
            <SummaryCard title="Win Rate" value={stats.winRateLabel} changeLabel="winning / decisive trades" trend="neutral" />
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-tj-muted uppercase tracking-wider">Performance Summary</h3>
            </div>
            <p className="text-tj-secondary text-sm leading-relaxed">
              {stats.totalTrades} recorded trade{stats.totalTrades !== 1 ? "s" : ""} with {formatPnL(stats.totalPnL)} total result.
              Win rate is {stats.winRateLabel} across {stats.decisive} decisive trade{stats.decisive !== 1 ? "s" : ""}; breakeven trades are excluded from the win-rate denominator.
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-xs font-medium text-tj-muted uppercase tracking-wider">Recent Trades</h3>
              <Button variant="outline" size="sm" type="button" onClick={() => navigate("/trades")}>
                View All
              </Button>
            </div>
            <RecentTrades trades={stats.recentTrades} />
          </div>
        </>
      )}
    </div>
  );
}
