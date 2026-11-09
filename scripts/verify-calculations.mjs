import { calculateProfitLoss, determineResult, normalizeTrade } from "../src/lib/tradeCalculator.js";
import { computeDashboardStats, groupTradesByDate, sortTradesNewestFirst } from "../src/lib/tradeStats.js";
import { isValidDateString } from "../src/lib/dates.js";
import { formatMoney } from "../src/lib/currency.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    throw new Error(message);
  }
}

console.log("Running comprehensive calculation & logic audit...");

// 1. BUY Formulas
assert(calculateProfitLoss("BUY", 100, 110, 2) === 20, "BUY win: (110-100)*2 = 20");
assert(calculateProfitLoss("BUY", 100, 90, 2) === -20, "BUY loss: (90-100)*2 = -20");
assert(calculateProfitLoss("BUY", 1.2500, 1.2550, 10000) === 50, "BUY forex fractional pip");
assert(calculateProfitLoss("BUY", 0.000012, 0.000015, 1000000) === 3, "BUY crypto low price");

// 2. SELL Formulas
assert(calculateProfitLoss("SELL", 100, 90, 2) === 20, "SELL win: (100-90)*2 = 20");
assert(calculateProfitLoss("SELL", 100, 110, 2) === -20, "SELL loss: (100-110)*2 = -20");
assert(calculateProfitLoss("SELL", 2000, 1950, 0.5) === 25, "SELL fractional quantity");

// 3. Breakeven
assert(calculateProfitLoss("BUY", 100, 100, 5) === 0, "BUY breakeven is 0");
assert(calculateProfitLoss("SELL", 100, 100, 5) === 0, "SELL breakeven is 0");

// 4. Edge cases & invalid inputs
assert(calculateProfitLoss("BUY", null, 100, 1) === 0, "Null entryPrice returns 0");
assert(calculateProfitLoss("BUY", 100, undefined, 1) === 0, "Undefined exitPrice returns 0");
assert(calculateProfitLoss("BUY", "invalid", 100, 1) === 0, "NaN returns 0");

// 5. Results
assert(determineResult(100) === "WIN", "Positive is WIN");
assert(determineResult(0.01) === "WIN", "Penny profit is WIN");
assert(determineResult(-0.01) === "LOSS", "Penny loss is LOSS");
assert(determineResult(-500) === "LOSS", "Negative is LOSS");
assert(determineResult(0) === "BREAKEVEN", "Zero is BREAKEVEN");
assert(determineResult(-0) === "BREAKEVEN", "Negative zero is BREAKEVEN");

// 6. Normalization
const normBuy = normalizeTrade({
  instrument: "  AAPL  ",
  direction: "buy",
  entryPrice: "150.50",
  exitPrice: "155.00",
  quantity: "10",
});
assert(normBuy.instrument === "AAPL", "Trim instrument whitespace");
assert(normBuy.direction === "BUY", "Normalize buy to uppercase BUY");
assert(normBuy.profitLoss === 45, "ProfitLoss calculated correctly");
assert(normBuy.result === "WIN", "Result WIN correctly computed");

// 7. Win rate calculation: must exclude breakeven from denominator
// Scenario A: 1 win, 1 loss, 1 breakeven -> 1 / (1 + 1) = 50%
const statsA = computeDashboardStats([
  { profitLoss: 100, result: "WIN" },
  { profitLoss: -50, result: "LOSS" },
  { profitLoss: 0, result: "BREAKEVEN" },
]);
assert(statsA.totalTrades === 3, "Total trades = 3");
assert(statsA.winning === 1, "Winning = 1");
assert(statsA.losing === 1, "Losing = 1");
assert(statsA.breakeven === 1, "Breakeven = 1");
assert(statsA.decisive === 2, "Decisive = 2");
assert(statsA.winRate === 50, "Win rate = 50.0%");
assert(statsA.winRateLabel === "50.0%", "Win rate label formatted");
assert(statsA.totalPnL === 50, "Total PnL = 50");

// Scenario B: All breakeven -> 0 / 0 decisive -> 0% (avoid divide-by-zero NaN)
const statsB = computeDashboardStats([
  { profitLoss: 0, result: "BREAKEVEN" },
  { profitLoss: 0, result: "BREAKEVEN" },
]);
assert(statsB.winRate === 0, "All breakeven win rate is 0");
assert(statsB.winRateLabel === "0.0%", "All breakeven label is 0.0%");

// Scenario C: Empty trades array
const statsC = computeDashboardStats([]);
assert(statsC.totalTrades === 0, "Empty total trades = 0");
assert(statsC.winRate === 0, "Empty win rate = 0");
assert(statsC.totalPnL === 0, "Empty total PnL = 0");

// 8. Sorting trades: newest first
const sorted = sortTradesNewestFirst([
  { date: "2026-11-01", time: "10:00", createdAt: "2026-11-01T10:00:00Z" },
  { date: "2026-11-05", time: "14:00", createdAt: "2026-11-05T14:00:00Z" },
  { date: "2026-11-05", time: "09:00", createdAt: "2026-11-05T09:00:00Z" },
]);
assert(sorted[0].date === "2026-11-05" && sorted[0].time === "14:00", "Newest first: Nov 5 14:00");
assert(sorted[1].date === "2026-11-05" && sorted[1].time === "09:00", "Second: Nov 5 09:00");
assert(sorted[2].date === "2026-11-01" && sorted[2].time === "10:00", "Third: Nov 1 10:00");

// 9. Calendar groupings
const grouped = groupTradesByDate([
  { date: "2026-11-05", profitLoss: 150, result: "WIN" },
  { date: "2026-11-05", profitLoss: -50, result: "LOSS" },
  { date: "2026-11-06", profitLoss: -20, result: "LOSS" },
]);
assert(grouped["2026-11-05"].totalPnL === 100, "Nov 5 combined PnL is 100");
assert(grouped["2026-11-05"].tradeCount === 2, "Nov 5 trade count is 2");
assert(grouped["2026-11-05"].result === "WIN", "Nov 5 day result is WIN");
assert(grouped["2026-11-06"].totalPnL === -20, "Nov 6 combined PnL is -20");
assert(grouped["2026-11-06"].tradeCount === 1, "Nov 6 trade count is 1");
assert(grouped["2026-11-06"].result === "LOSS", "Nov 6 day result is LOSS");

// 10. Date validation
assert(isValidDateString("2026-11-09") === true, "Valid 2026-11-09");
assert(isValidDateString("2026-02-29") === false, "2026 is not a leap year - invalid");
assert(isValidDateString("2024-02-29") === true, "2024 is a leap year - valid");
assert(isValidDateString("not-a-date") === false, "String is invalid");

console.log("All 10 test suites (27 assertions) passed successfully.");
