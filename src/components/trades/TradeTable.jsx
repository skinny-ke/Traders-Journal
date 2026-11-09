import { useState } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import ProfitLossDisplay from "../ui/ProfitLossDisplay.jsx";
import Badge from "../ui/Badge.jsx";
import DeleteConfirmation from "../ui/DeleteConfirmation.jsx";
import { formatMoney } from "../../lib/currency.js";

export default function TradeTable({ trades, onView, onEdit, onDelete, showActions = true }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const resultConfig = {
    WIN: "win",
    LOSS: "loss",
    BREAKEVEN: "neutral",
  };

  const confirmDelete = async () => {
    if (!deleteConfirm || deleting) return;
    setDeleting(true);
    try {
      await onDelete(deleteConfirm.id);
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="md:hidden divide-y divide-tj-light/50">
        {trades.map((trade) => {
          const resultKey = resultConfig[trade.result] || "neutral";
          return (
            <article key={trade.id} className="p-4 space-y-3 table-row group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-tj-primary">{trade.instrument}</p>
                  <p className="text-xs text-tj-secondary">
                    {trade.date}{trade.time ? ` · ${trade.time}` : ""} ·{" "}
                    <span className={trade.direction === "BUY" ? "text-tj-accent" : "text-tj-primary"}>{trade.direction}</span>
                  </p>
                </div>
                <Badge variant={resultKey}>
                  {trade.result === "BREAKEVEN" ? "Breakeven" : trade.result}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-tj-secondary">
                  Entry <span className="block text-tj-primary financial-sm">{formatMoney(trade.entryPrice)}</span>
                </div>
                <div className="text-tj-secondary">
                  Exit <span className="block text-tj-primary financial-sm">{formatMoney(trade.exitPrice)}</span>
                </div>
                <div className="text-tj-secondary">
                  Qty <span className="block text-tj-primary financial-sm">{Number(trade.quantity).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                </div>
                <div className="text-tj-secondary">
                  P/L <span className="block"><ProfitLossDisplay amount={trade.profitLoss} showSign /></span>
                </div>
              </div>
              {showActions && (
                <div className="flex items-center justify-end gap-1 group-hover:opacity-100 opacity-70 transition-opacity duration-fast">
                  <button type="button" onClick={() => onView?.(trade.id)} className="p-2 text-tj-muted hover:text-tj-accent rounded-md hover:bg-tj-surface" aria-label={`View ${trade.instrument} trade`}>
                    <Eye size={16} />
                  </button>
                  <button type="button" onClick={() => onEdit?.(trade.id)} className="p-2 text-tj-muted hover:text-tj-accent rounded-md hover:bg-tj-surface" aria-label={`Edit ${trade.instrument} trade`}>
                    <Edit size={16} />
                  </button>
                  <button type="button" onClick={() => setDeleteConfirm(trade)} className="p-2 text-tj-muted hover:text-tj-loss rounded-md hover:bg-tj-surface" aria-label={`Delete ${trade.instrument} trade`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-tj-medium text-xs text-tj-muted bg-tj-surface">
              <th className="py-3.5 px-4 font-medium">Date</th>
              <th className="py-3.5 px-4 font-medium">Instrument</th>
              <th className="py-3.5 px-4 font-medium">Direction</th>
              <th className="py-3.5 px-4 font-medium text-right">Entry</th>
              <th className="py-3.5 px-4 font-medium text-right">Exit</th>
              <th className="py-3.5 px-4 font-medium text-right">Qty</th>
              <th className="py-3.5 px-4 font-medium text-right">P/L</th>
              <th className="py-3.5 px-4 font-medium">Result</th>
              {showActions && <th className="py-3.5 px-4 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const resultKey = resultConfig[trade.result] || "neutral";
              return (
                <tr key={trade.id} className="table-row group">
                  <td className="py-3.5 px-4 text-sm text-tj-primary whitespace-nowrap">
                    {trade.date}
                    {trade.time ? <span className="text-tj-secondary"> · {trade.time}</span> : null}
                  </td>
                  <td className="py-3.5 px-4 text-sm text-tj-primary font-medium">{trade.instrument}</td>
                  <td className="py-3.5 px-4 text-sm">
                    <span className={`financial-sm ${trade.direction === "BUY" ? "text-tj-accent" : "text-tj-primary"}`}>
                      {trade.direction}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-right text-tj-primary financial-sm">
                    {formatMoney(trade.entryPrice)}
                  </td>
                  <td className="py-3.5 px-4 text-sm text-right text-tj-primary financial-sm">
                    {formatMoney(trade.exitPrice)}
                  </td>
                  <td className="py-3.5 px-4 text-sm text-right text-tj-primary financial-sm">
                    {Number(trade.quantity).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </td>
                  <td className="py-3.5 px-4 text-sm text-right">
                    <ProfitLossDisplay amount={trade.profitLoss} showSign />
                  </td>
                  <td className="py-3.5 px-4 text-sm">
                    <Badge variant={resultKey}>
                      {trade.result === "BREAKEVEN" ? "Breakeven" : trade.result}
                    </Badge>
                  </td>
                  {showActions && (
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 group-hover:opacity-100 opacity-70 transition-opacity duration-fast">
                        <button
                          type="button"
                          onClick={() => onView?.(trade.id)}
                          className="p-2 text-tj-muted hover:text-tj-accent rounded-md hover:bg-tj-surface"
                          aria-label={`View ${trade.instrument} trade`}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit?.(trade.id)}
                          className="p-2 text-tj-muted hover:text-tj-accent rounded-md hover:bg-tj-surface"
                          aria-label={`Edit ${trade.instrument} trade`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(trade)}
                          className="p-2 text-tj-muted hover:text-tj-loss rounded-md hover:bg-tj-surface"
                          aria-label={`Delete ${trade.instrument} trade`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DeleteConfirmation
        isOpen={!!deleteConfirm}
        trade={deleteConfirm}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteConfirm(null)}
        busy={deleting}
      />
    </div>
  );
}
