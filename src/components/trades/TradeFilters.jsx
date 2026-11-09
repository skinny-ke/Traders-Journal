import { Search } from "lucide-react";

export default function TradeFilters({
  searchQuery,
  setSearchQuery,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  directionFilter,
  setDirectionFilter,
  resultFilter,
  setResultFilter,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  onClear,
}) {
  return (
    <div className="card p-5">
      <div className="flex flex-wrap gap-3 items-end text-sm">
        <div className="relative flex-1 min-w-[240px]">
          <label htmlFor="trade-search" className="sr-only">Search by instrument</label>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tj-muted pointer-events-none" />
          <input
            id="trade-search"
            type="text"
            placeholder="Search instrument..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="date-from" className="label">From</label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="date-to" className="label">To</label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="direction-filter" className="label">Direction</label>
          <select
            id="direction-filter"
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="input"
          >
            <option value="">All</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="result-filter" className="label">Result</label>
          <select
            id="result-filter"
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="input"
          >
            <option value="">All</option>
            <option value="WIN">Win</option>
            <option value="LOSS">Loss</option>
            <option value="BREAKEVEN">Breakeven</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sort-by" className="label">Sort</label>
          <select
            id="sort-by"
            value={`${sortBy}-${sortDir}`}
            onChange={(e) => {
              const [nextSort, nextDir] = e.target.value.split("-");
              setSortBy(nextSort);
              setSortDir(nextDir);
            }}
            className="input"
          >
            <option value="date-desc">Date (newest)</option>
            <option value="date-asc">Date (oldest)</option>
            <option value="pnl-desc">P/L (high to low)</option>
            <option value="pnl-asc">P/L (low to high)</option>
          </select>
        </div>

        <button type="button" onClick={onClear} className="btn-ghost px-4 py-2">
          Clear filters
        </button>
      </div>
    </div>
  );
}
