import { determineResult } from "./tradeCalculator.js";

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

export function sortTradesNewestFirst(trades) {
  return [...trades].sort((a, b) => {
    const aKey = `${a.date || ""}T${a.time || "00:00"}|${a.createdAt || ""}`;
    const bKey = `${b.date || ""}T${b.time || "00:00"}|${b.createdAt || ""}`;
    return bKey.localeCompare(aKey);
  });
}

export function computeDashboardStats(trades) {
  const totalTrades = trades.length;
  const winning = trades.filter((t) => t.result === "WIN").length;
  const losing = trades.filter((t) => t.result === "LOSS").length;
  const breakeven = trades.filter((t) => t.result === "BREAKEVEN").length;
  const totalPnL = roundMoney(trades.reduce((sum, t) => sum + Number(t.profitLoss || 0), 0));
  const decisive = winning + losing;
  const winRate = decisive > 0 ? (winning / decisive) * 100 : 0;

  return {
    totalTrades,
    winning,
    losing,
    breakeven,
    totalPnL,
    decisive,
    winRate,
    winRateLabel: `${winRate.toFixed(1)}%`,
    recentTrades: sortTradesNewestFirst(trades).slice(0, 5),
  };
}

export function groupTradesByDate(trades) {
  const grouped = {};

  for (const trade of trades) {
    const dateKey = trade.date;
    if (!dateKey) continue;
    if (!grouped[dateKey]) {
      grouped[dateKey] = { trades: [], totalPnL: 0, tradeCount: 0, result: "BREAKEVEN" };
    }
    grouped[dateKey].trades.push(trade);
    grouped[dateKey].totalPnL = roundMoney(grouped[dateKey].totalPnL + Number(trade.profitLoss || 0));
    grouped[dateKey].tradeCount += 1;
  }

  for (const group of Object.values(grouped)) {
    group.trades = sortTradesNewestFirst(group.trades);
    group.result = determineResult(group.totalPnL);
  }

  return grouped;
}
