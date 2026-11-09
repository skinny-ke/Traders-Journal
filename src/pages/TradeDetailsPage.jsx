import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { useTrades } from "../hooks/useTrades.js";
import { useToast } from "../context/ToastContext.jsx";
import ProfitLossDisplay from "../components/ui/ProfitLossDisplay.jsx";
import Badge from "../components/ui/Badge.jsx";
import DeleteConfirmation from "../components/ui/DeleteConfirmation.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";
import { resolveScreenshotDisplay } from "../services/screenshotService.js";
import { hasScreenshot } from "../lib/tradeMapper.js";
import { formatMoney } from "../lib/currency.js";

export default function TradeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTrade, loadTrade, removeTrade, loading, error } = useTrades();
  const { success, error: showError } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [fetchedTrade, setFetchedTrade] = useState(null);

  const cachedTrade = getTrade(id);
  const trade = cachedTrade || fetchedTrade;

  useEffect(() => {
    let cancelled = false;
    if (cachedTrade) {
      setFetchedTrade(null);
      return undefined;
    }
    loadTrade(id).then((record) => {
      if (!cancelled) setFetchedTrade(record);
    });
    return () => {
      cancelled = true;
    };
  }, [id, cachedTrade, loadTrade]);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    async function loadScreenshot() {
      if (!hasScreenshot(trade?.screenshot)) {
        setScreenshotUrl(null);
        return;
      }
      setScreenshotLoading(true);
      try {
        const result = await resolveScreenshotDisplay(trade.screenshot);
        if (cancelled) {
          if (result.objectUrl && result.url) URL.revokeObjectURL(result.url);
          return;
        }
        if (result.objectUrl) objectUrl = result.url;
        setScreenshotUrl(result.url);
      } catch {
        if (!cancelled) setScreenshotUrl(null);
      } finally {
        if (!cancelled) setScreenshotLoading(false);
      }
    }

    loadScreenshot();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [trade?.screenshot]);

  if (loading) return <LoadingState message="Loading trade…" />;

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-tj-loss">{error}</p>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-tj-primary font-semibold">Trade not found</h2>
        <p className="text-tj-secondary text-sm mt-1">The trade you're looking for doesn't exist.</p>
        <button type="button" onClick={() => navigate("/trades")} className="mt-6 btn-primary px-6 py-2.5">
          Back to Trade History
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await removeTrade(trade.id);
      success("Trade deleted.", 3000);
      navigate("/trades");
    } catch (err) {
      showError(err?.message || "Failed to delete trade.", 4000);
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const resultLabel = trade.result === "BREAKEVEN" ? "Breakeven" : trade.result;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate("/trades")}
          className="mt-1 p-2.5 rounded-xl text-tj-muted hover:text-tj-primary hover:bg-tj-surface transition-colors duration-fast"
          aria-label="Back to trade history"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-tj-primary tracking-tight">Trade Details</h1>
          <p className="text-tj-secondary text-sm break-words">
            {trade.instrument} · {trade.date}
            {trade.time ? ` · ${trade.time}` : ""}
          </p>
        </div>
      </div>

      <div className="card p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Detail label="Instrument" value={trade.instrument} />
          <Detail
            label="Direction"
            value={<span className={trade.direction === "BUY" ? "text-tj-accent financial-sm" : "text-tj-primary financial-sm"}>{trade.direction}</span>}
          />
          <Detail label="Date" value={trade.date} />
          <Detail label="Time" value={trade.time || "—"} />
          <Detail label="Entry Price" value={<span className="financial-sm">{formatMoney(trade.entryPrice)}</span>} />
          <Detail label="Exit Price" value={<span className="financial-sm">{formatMoney(trade.exitPrice)}</span>} />
          <Detail label="Quantity" value={<span className="financial-sm">{Number(trade.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>} />
          <Detail label="Profit / Loss" value={<ProfitLossDisplay amount={trade.profitLoss} showSign className="font-bold" />} />
          <Detail
            label="Result"
            value={
              <Badge variant={trade.result === "WIN" ? "win" : trade.result === "LOSS" ? "loss" : "neutral"}>
                {resultLabel}
              </Badge>
            }
          />
          <Detail label="Created" value={formatDateTime(trade.createdAt)} />
          <Detail label="Last Updated" value={formatDateTime(trade.updatedAt)} />
        </div>

        <div className="mt-6 pt-6 border-t border-tj-light/50 space-y-2">
          <span className="text-xs font-medium text-tj-muted uppercase tracking-wider block">Screenshot</span>
          {hasScreenshot(trade.screenshot) ? (
            screenshotLoading ? (
              <p className="text-sm text-tj-secondary">Loading screenshot…</p>
            ) : screenshotUrl ? (
              <div className="space-y-2">
                <img
                  src={screenshotUrl}
                  alt={`${trade.instrument} trade screenshot`}
                  className="w-full max-w-md rounded-xl border border-tj-light bg-tj-surface object-contain"
                />
                <p className="text-[11px] text-tj-muted break-all">{trade.screenshot.name}</p>
              </div>
            ) : (
              <p className="text-sm text-tj-secondary">Screenshot metadata saved, but the image could not be loaded from local storage.</p>
            )
          ) : (
            <p className="text-sm text-tj-secondary">No screenshot attached.</p>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-tj-light/50 space-y-2">
          <span className="text-xs font-medium text-tj-muted uppercase tracking-wider block">Personal notes</span>
          <p className="text-tj-primary text-sm whitespace-pre-wrap break-words">{trade.notes || "No notes added."}</p>
        </div>

        <div className="pt-6 mt-6 border-t border-tj-light/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button type="button" onClick={() => navigate(`/trades/${trade.id}/edit`)} className="btn-outline px-4 py-2.5">
            <Edit2 size={16} />
            Edit Trade
          </button>
          <button type="button" onClick={() => setConfirmOpen(true)} className="btn-danger px-4 py-2.5">
            <Trash2 size={16} />
            Delete Trade
          </button>
        </div>
      </div>

      <DeleteConfirmation
        isOpen={confirmOpen}
        trade={trade}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirmOpen(false)}
        busy={deleting}
      />
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <span className="text-xs font-medium text-tj-muted block">{label}</span>
      <div className="text-tj-primary text-sm break-words">{value}</div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}
