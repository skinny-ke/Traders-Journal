import CalendarDay from "./CalendarDay.jsx";
import { getDaysInMonth, getFirstDayIndex, toDateKey } from "../../lib/dates.js";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarGrid({ year, month, tradesByDate, selectedDate, todayKey, onSelectDate }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayIndex(year, month);
  const prevMonthDate = new Date(year, month - 1, 1);
  const prevMonthLastDay = getDaysInMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
  const trailing = (7 - ((firstDayIndex + daysInMonth) % 7)) % 7;

  return (
    <>
      <div className="grid grid-cols-7 gap-1 text-xs text-tj-muted font-medium mb-3 uppercase tracking-wider">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center py-1">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayIndex }, (_, i) => {
          const day = prevMonthLastDay - firstDayIndex + i + 1;
          return (
            <div key={`prev-${i}`} className="min-h-[76px] sm:min-h-[92px] rounded-xl border border-transparent flex items-start justify-center p-1 text-tj-muted/35">
              <span className="text-xs">{day}</span>
            </div>
          );
        })}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateKey = toDateKey(year, month, day);
          return (
            <CalendarDay
              key={dateKey}
              day={day}
              dateKey={dateKey}
              group={tradesByDate[dateKey]}
              isToday={dateKey === todayKey}
              isSelected={dateKey === selectedDate}
              onSelect={onSelectDate}
            />
          );
        })}
        {Array.from({ length: trailing }, (_, i) => (
          <div key={`next-${i}`} className="min-h-[76px] sm:min-h-[92px] rounded-xl border border-transparent flex items-start justify-center p-1 text-tj-muted/35">
            <span className="text-xs">{i + 1}</span>
          </div>
        ))}
      </div>
    </>
  );
}
