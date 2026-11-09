import { useEffect } from "react";

export default function DeleteConfirmation({ isOpen, onConfirm, onCancel, trade, busy = false }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape" && !busy) onCancel?.();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, busy, onCancel]);

  if (!isOpen || !trade) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={busy ? undefined : onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="card p-6 w-full max-w-md shadow-modal" role="dialog" aria-modal="true" aria-labelledby="delete-trade-title">
          <h3 id="delete-trade-title" className="text-lg font-bold text-tj-primary mb-2">Delete Trade</h3>
          <p className="text-tj-secondary text-sm mb-6 leading-relaxed">
            Delete the trade for <span className="text-tj-primary font-medium">{trade.instrument}</span> on{" "}
            <span className="text-tj-primary font-medium">{trade.date}</span>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} disabled={busy} className="btn-ghost px-4 py-2 disabled:opacity-60">
              Cancel
            </button>
            <button type="button" onClick={onConfirm} disabled={busy} className="btn-danger px-4 py-2 disabled:opacity-60">
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
