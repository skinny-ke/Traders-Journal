import ProfitLossDisplay from "../ui/ProfitLossDisplay.jsx";

export default function CalendarDay({
  day,
  dateKey,
  group,
  isToday,
  isSelected,
  onSelect,
}) {
  let baseTone = "bg-tj-card border-tj-light/50 text-tj-primary";
  let fillTone = "";
  let textTone = "text-tj-primary";

  if (group?.tradeCount > 0) {
    if (group.totalPnL > 0) {
      baseTone = "bg-tj-profit-soft border-tj-profit/30";
      fillTone = "bg-tj-profit";
      textTone = "text-tj-profit-dark";
    } else if (group.totalPnL < 0) {
      baseTone = "bg-tj-loss-soft border-tj-loss/30";
      fillTone = "bg-tj-loss";
      textTone = "text-tj-loss-dark";
    } else {
      baseTone = "bg-tj-surface border-tj-light";
    }
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(dateKey)}
      className={`min-h-[76px] sm:min-h-[92px] rounded-xl border p-1.5 text-left transition-all duration-fast hover:border-tj-accent/50 hover:bg-tj-surface ${baseTone} ${isToday ? "ring-2 ring-tj-accent" : ""} ${isSelected ? "ring-2 ring-tj-accent bg-tj-accent/10" : ""}`}
      aria-pressed={isSelected}
      aria-label={`${dateKey}${group?.tradeCount ? `, ${group.tradeCount} trades` : ""}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-medium text-tj-primary">{day}</span>
        {group?.tradeCount > 0 && <span className="text-[10px] text-tj-muted">{group.tradeCount}</span>}
      </div>
      {group?.tradeCount > 0 && (
        <div className="mt-2">
          <div className={`text-[10px] sm:text-[11px] font-mono font-semibold ${textTone}`}>
            <ProfitLossDisplay amount={group.totalPnL} showSign />
          </div>
          {fillTone && <div className={`h-1 w-full rounded-full ${fillTone} mt-1.5`} />}
        </div>
      )}
    </button>
  );
}
