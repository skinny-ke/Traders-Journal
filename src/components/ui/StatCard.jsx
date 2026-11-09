import { ChevronUp, ChevronDown } from "lucide-react";

export default function StatCard({ title, value, change, changeLabel, trend = "neutral" }) {
  const isPositive = trend === "up";
  const isNegative = trend === "down";

  const changeColor = isPositive ? "text-tj-profit" : isNegative ? "text-tj-loss" : "text-tj-muted";
  const changeBg = isPositive ? "bg-tj-profit-soft" : isNegative ? "bg-tj-loss-soft" : "bg-tj-surface";

  return (
    <div className="card p-6">
      <h3 className="text-xs font-medium text-tj-muted uppercase tracking-wider mb-4">{title}</h3>
      <div className="mb-2">
        <span className="financial-lg font-bold text-tj-primary">{value}</span>
      </div>
      {(change !== undefined || changeLabel !== undefined) && (
        <div className={`flex items-center gap-1.5 text-xs font-medium ${changeColor} ${changeBg} rounded-lg px-2.5 py-1 w-fit`}>
          {isPositive ? <ChevronUp size={12} /> : isNegative ? <ChevronDown size={12} /> : null}
          {change !== undefined && <span className="financial-sm">{change}</span>}
          {changeLabel !== undefined && <span className="opacity-70">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}
