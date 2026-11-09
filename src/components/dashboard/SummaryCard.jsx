import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

export default function SummaryCard({
  title,
  value,
  change,
  changeLabel,
  trend = "neutral",
  icon: Icon,
}) {
  const isPositive = trend === "up";
  const isNegative = trend === "down";

  const changeColor = isPositive ? "text-tj-profit" : isNegative ? "text-tj-loss" : "text-tj-muted";
  const changeBg = isPositive ? "bg-tj-profit-soft" : isNegative ? "bg-tj-loss-soft" : "bg-tj-surface";

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xs font-medium text-tj-muted uppercase tracking-wider">{title}</h3>
        {Icon && <Icon size={16} className="text-tj-muted flex-shrink-0" />}
      </div>
      <div className="mb-2">
        <span className="financial-lg font-bold text-tj-primary">{value}</span>
      </div>
      {change !== undefined && changeLabel !== undefined && (
        <div className={`flex items-center gap-1.5 text-xs font-medium ${changeColor} ${changeBg} rounded-lg px-2.5 py-1 w-fit`}>
          {isPositive ? (
            <ArrowUpRight size={12} />
          ) : isNegative ? (
            <ArrowDownRight size={12} />
          ) : (
            <TrendingUp size={12} className="opacity-50" />
          )}
          <span className="financial-sm">{change}</span>
          <span className="opacity-70">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
