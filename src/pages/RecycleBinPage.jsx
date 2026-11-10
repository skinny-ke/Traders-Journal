import { useState, useEffect, useCallback } from "react";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import {
  getDeletedTrades,
  restoreTrade,
  permanentlyDeleteTrade,
  emptyRecycleBin,
} from "../services/tradeService.js";
import { useTrades } from "../hooks/useTrades.js";
import { useToast } from "../context/ToastContext.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ProfitLossDisplay from "../components/ui/ProfitLossDisplay.jsx";
import Badge from "../components/ui/Badge.jsx";
import DeleteConfirmation from "../components/ui/DeleteConfirmation.jsx";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecycleBinPage() {
  const { reload } = useTrades();
  const { success, error: showError } = useToast();

  const [deletedTrades, setDeletedTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Per-row busy states
  const [restoringId, setRestoringId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Confirm modals
  const [confirmPermanent, setConfirmPermanent] = useState(null); // trade object
  const [confirmEmptyBin, setConfirmEmptyBin] = useState(false);
  const [emptyingBin, setEmptyingBin] = useState(false);

  const fetchDeleted = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await getDeletedTrades();
      setDeletedTrades(list);
    } catch (err) {
      setFetchError(err?.message || "Failed to load Recycle Bin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  const handleRestore = async (trade) => {
    if (restoringId) return;
    setRestoringId(trade.id);
    try {
      await restoreTrade(trade.id);
      setDeletedTrades((prev) => prev.filter((t) => t.id !== trade.id));
      await reload();
      success(`${trade.instrument} restored to Trade History.`, 3000);
    } catch (err) {
      showError(err?.message || "Failed to restore trade.", 4000);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmPermanent || deletingId) return;
    const trade = confirmPermanent;
    setDeletingId(trade.id);
    try {
      await permanentlyDeleteTrade(trade.id);
      setDeletedTrades((prev) => prev.filter((t) => t.id !== trade.id));
      success("Trade permanently deleted.", 3000);
    } catch (err) {
      showError(err?.message || "Failed to permanently delete trade.", 4000);
    } finally {
      setDeletingId(null);
      setConfirmPermanent(null);
    }
  };

  const handleEmptyBin = async () => {
    if (emptyingBin) return;
    setEmptyingBin(true);
    try {
      const count = await emptyRecycleBin();
      setDeletedTrades([]);
      success(`Recycle Bin emptied. ${count} trade${count !== 1 ? "s" : ""} permanently deleted.`, 4000);
    } catch (err) {
      showError(err?.message || "Failed to empty Recycle Bin.", 4000);
    } finally {
      setEmptyingBin(false);
      setConfirmEmptyBin(false);
    }
  };

  if (loading) return <LoadingState message="Loading Recycle Bin…" />;

  if (fetchError) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertTriangle className="mx-auto text-tj-loss" size={32} />
        <p className="text-tj-loss font-medium">{fetchError}</p>
        <button type="button" onClick={fetchDeleted} className="btn-outline px-4 py-2">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-tj-primary tracking-tight">Recycle Bin</h1>
          <p className="text-tj-secondary text-sm mt-1">
            Deleted trades are stored here. Restore them or permanently remove them.
          </p>
        </div>

        {deletedTrades.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmEmptyBin(true)}
            disabled={emptyingBin}
            className="btn-danger px-4 py-2 flex items-center gap-2 disabled:opacity-60 shrink-0"
          >
            <Trash2 size={15} />
            Empty Bin
          </button>
        )}
      </div>

      {/* Content */}
      {deletedTrades.length === 0 ? (
        <EmptyState
          title="Recycle Bin is empty"
          description="Trades you delete will appear here. You can restore them or permanently remove them."
          icon="🗑️"
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tj-medium">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-tj-muted uppercase tracking-wider">
                    Instrument
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-tj-muted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-tj-muted uppercase tracking-wider">
                    Direction
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-tj-muted uppercase tracking-wider">
                    P/L
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-tj-muted uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-tj-muted uppercase tracking-wider">
                    Deleted
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-tj-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tj-light/50">
                {deletedTrades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-tj-surface/50 transition-colors duration-fast">
                    <td className="px-4 py-3 font-semibold text-tj-primary">{trade.instrument}</td>
                    <td className="px-4 py-3 text-tj-secondary">{formatDate(trade.date)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          trade.direction === "BUY"
                            ? "text-tj-accent font-medium financial-sm"
                            : "text-tj-primary font-medium financial-sm"
                        }
                      >
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ProfitLossDisplay amount={trade.profitLoss} showSign />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          trade.result === "WIN" ? "win" : trade.result === "LOSS" ? "loss" : "neutral"
                        }
                      >
                        {trade.result === "BREAKEVEN" ? "Breakeven" : trade.result}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-tj-muted text-xs">{formatDateTime(trade.deletedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRestore(trade)}
                          disabled={restoringId === trade.id || !!deletingId}
                          className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-60"
                          title="Restore trade"
                        >
                          <RotateCcw size={13} />
                          {restoringId === trade.id ? "Restoring…" : "Restore"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmPermanent(trade)}
                          disabled={!!restoringId || deletingId === trade.id}
                          className="btn-danger py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-60"
                          title="Permanently delete trade"
                        >
                          <Trash2 size={13} />
                          {deletingId === trade.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {deletedTrades.map((trade) => (
              <div key={trade.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-tj-primary">{trade.instrument}</p>
                    <p className="text-xs text-tj-muted mt-0.5">{formatDate(trade.date)}</p>
                  </div>
                  <Badge
                    variant={
                      trade.result === "WIN" ? "win" : trade.result === "LOSS" ? "loss" : "neutral"
                    }
                  >
                    {trade.result === "BREAKEVEN" ? "Breakeven" : trade.result}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span
                    className={
                      trade.direction === "BUY"
                        ? "text-tj-accent font-medium financial-sm"
                        : "text-tj-primary font-medium financial-sm"
                    }
                  >
                    {trade.direction}
                  </span>
                  <ProfitLossDisplay amount={trade.profitLoss} showSign className="font-semibold" />
                </div>

                <p className="text-[11px] text-tj-muted border-t border-tj-light/50 pt-2">
                  Deleted {formatDateTime(trade.deletedAt)}
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleRestore(trade)}
                    disabled={restoringId === trade.id || !!deletingId}
                    className="flex-1 btn-outline py-2 text-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <RotateCcw size={14} />
                    {restoringId === trade.id ? "Restoring…" : "Restore"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmPermanent(trade)}
                    disabled={!!restoringId || deletingId === trade.id}
                    className="flex-1 btn-danger py-2 text-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <Trash2 size={14} />
                    {deletingId === trade.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirm permanent delete — single trade */}
      <DeleteConfirmation
        isOpen={!!confirmPermanent}
        trade={confirmPermanent}
        title="Permanently Delete Trade"
        message={
          confirmPermanent
            ? `Permanently delete the trade for ${confirmPermanent.instrument} on ${formatDate(confirmPermanent.date)}? This cannot be undone and the screenshot will also be removed.`
            : undefined
        }
        confirmLabel="Delete Permanently"
        onConfirm={handlePermanentDelete}
        onCancel={() => !deletingId && setConfirmPermanent(null)}
        busy={!!deletingId}
      />

      {/* Confirm empty bin */}
      <DeleteConfirmation
        isOpen={confirmEmptyBin}
        title="Empty Recycle Bin"
        message={`Permanently delete all ${deletedTrades.length} trade${deletedTrades.length !== 1 ? "s" : ""} in the Recycle Bin? This cannot be undone and all associated screenshots will be removed.`}
        confirmLabel="Empty Bin"
        onConfirm={handleEmptyBin}
        onCancel={() => !emptyingBin && setConfirmEmptyBin(false)}
        busy={emptyingBin}
      />
    </div>
  );
}

