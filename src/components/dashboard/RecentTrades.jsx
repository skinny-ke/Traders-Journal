import { useNavigate } from "react-router-dom";
import Badge from "../ui/Badge.jsx";
import ProfitLossDisplay from "../ui/ProfitLossDisplay.jsx";

function formatDateShort(dateString) {
  if (!dateString) return "-";
  const d = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function RecentTrades({ trades }) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-tj-medium text-xs text-tj-muted">
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Instrument</th>
            <th className="pb-3 font-medium">Direction</th>
            <th className="pb-3 font-medium text-right">P/L</th>
            <th className="pb-3 font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.id}
              className="border-b border-tj-light/50 hover:bg-tj-surface transition-colors duration-fast cursor-pointer group"
              onClick={() => navigate(`/trades/${trade.id}`)}
            >
              <td className="py-3 text-sm text-tj-primary whitespace-nowrap">{formatDateShort(trade.date)}</td>
              <td className="py-3 text-sm text-tj-primary font-medium">{trade.instrument}</td>
              <td className="py-3 text-sm">
                <span className={trade.direction === "BUY" ? "text-tj-accent financial-sm" : "text-tj-primary financial-sm"}>
                  {trade.direction}
                </span>
              </td>
              <td className="py-3 text-sm text-right">
                <ProfitLossDisplay amount={trade.profitLoss} showSign />
              </td>
              <td className="py-3 text-sm">
                <Badge
                  variant={trade.result === "WIN" ? "win" : trade.result === "LOSS" ? "loss" : "neutral"}
                >
                  {trade.result === "BREAKEVEN" ? "Breakeven" : trade.result}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
