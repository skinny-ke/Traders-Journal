export function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/** Monday = 0 ... Sunday = 6 */
export function getFirstDayIndex(year, month) {
  const d = new Date(year, month, 1);
  return (d.getDay() + 6) % 7;
}

export function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
}

export function todayDateKey() {
  const today = new Date();
  return toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
}
