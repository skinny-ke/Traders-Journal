import { formatPnL } from "../../lib/tradeCalculator.js";

export default function ProfitLossDisplay({ amount, className = "", showSign = true }) {
  const value = Number(amount);
  const isPositive = value > 0;
  const isNegative = value < 0;

  const colorClass = isPositive ? "text-tj-profit" : isNegative ? "text-tj-loss" : "text-tj-muted";
  const text = showSign ? formatPnL(value) : formatPnL(value).replace(/^[+]/, "");

  return <span className={`financial-base font-semibold ${colorClass} ${className}`}>{text}</span>;
}
