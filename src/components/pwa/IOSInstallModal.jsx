import { X, Share, PlusSquare, Smartphone } from "lucide-react";

/**
 * Modal with step-by-step iOS "Add to Home Screen" instructions.
 * Triggered from Settings → App when iOS is detected and the app is not
 * already running in standalone mode.
 */
export default function IOSInstallModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-tj-card border border-tj-medium rounded-2xl w-full max-w-sm shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-tj-medium">
          <div className="flex items-center gap-2 text-tj-accent">
            <Smartphone size={18} strokeWidth={2} />
            <h2 className="text-sm font-semibold text-tj-primary">Install Trade Journal</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-tj-muted hover:text-tj-primary p-1 rounded-lg hover:bg-tj-surface transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <p className="text-xs text-tj-secondary leading-relaxed">
            Safari on iPhone and iPad doesn't use the standard install prompt.
            Follow these steps to add Trade Journal to your Home Screen.
          </p>

          <ol className="space-y-3">
            <Step number={1} icon={<Share size={15} />} title="Open in Safari">
              Make sure you're using <strong className="text-tj-primary">Safari</strong>. Other
              browsers on iOS don't support Home Screen installation.
            </Step>

            <Step number={2} icon={<Share size={15} />} title='Tap the Share button'>
              Tap the <strong className="text-tj-primary">Share</strong> icon{" "}
              <span className="inline-flex items-center justify-center w-5 h-5 bg-tj-surface rounded text-tj-accent text-[10px] font-bold align-middle">
                ↑
              </span>{" "}
              in the Safari toolbar at the bottom (iPhone) or top (iPad) of the screen.
            </Step>

            <Step number={3} icon={<PlusSquare size={15} />} title="Add to Home Screen">
              Scroll down in the Share sheet and tap{" "}
              <strong className="text-tj-primary">Add to Home Screen</strong>.
            </Step>

            <Step number={4} icon={<PlusSquare size={15} />} title="Confirm">
              Tap <strong className="text-tj-primary">Add</strong> in the top-right corner to
              confirm. Trade Journal will appear on your Home Screen.
            </Step>
          </ol>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline w-full py-2.5 text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({ number, icon, title, children }) {
  return (
    <li className="flex gap-3">
      <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-tj-accent-soft text-tj-accent text-[11px] font-bold mt-0.5">
        {number}
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-tj-primary text-xs font-semibold mb-0.5">
          <span className="text-tj-accent">{icon}</span>
          {title}
        </div>
        <p className="text-xs text-tj-secondary leading-relaxed">{children}</p>
      </div>
    </li>
  );
}

