import { useState } from "react";
import { Download, Share, X } from "lucide-react";
import Button from "../ui/Button.jsx";
import { usePWA } from "../../hooks/usePWA.js";

/**
 * Floating install banner.
 *
 * Shows in two situations:
 *  1. Chromium / Android / Desktop — when `beforeinstallprompt` fired and the
 *     user has not yet dismissed the banner.
 *  2. iOS Safari — when the app is not already running in standalone mode and
 *     the user has not dismissed the banner.
 *
 * After the banner is dismissed the user can still install via Settings → App.
 */
export default function InstallPrompt() {
  const { canInstall, isInstalled, isStandalone, isIOS, dismissed, installApp, dismissInstall } =
    usePWA();
  const [installing, setInstalling] = useState(false);

  // Show the banner for Chromium (canInstall) OR for iOS (isIOS).
  const showChromium = canInstall && !isInstalled && !isStandalone && !dismissed;
  const showIOS = isIOS && !isStandalone && !dismissed;
  const show = showChromium || showIOS;

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await installApp();
    setInstalling(false);
    // If user dismissed the browser prompt, hide our banner too.
    if (!accepted) dismissInstall();
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-80 z-[60] lg:bottom-6">
      <div className="bg-tj-card border border-tj-medium rounded-xl p-4 shadow-modal">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-tj-accent-soft text-tj-accent shrink-0 mt-0.5">
            {isIOS ? <Share size={18} strokeWidth={2} /> : <Download size={18} strokeWidth={2} />}
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <h3 className="text-sm font-semibold text-tj-primary">Install Trade Journal</h3>
            <p className="text-tj-secondary text-xs mt-1 leading-relaxed">
              {isIOS
                ? 'Tap the Share button in Safari, then choose "Add to Home Screen".'
                : "Install as an app for faster access and offline support."}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissInstall}
            className="text-tj-muted hover:text-tj-primary transition-colors p-1 rounded-lg hover:bg-tj-surface flex-shrink-0"
            aria-label="Dismiss install prompt"
          >
            <X size={14} />
          </button>
        </div>

        {/* Chromium / Android / Desktop — native install button */}
        {showChromium && (
          <div className="mt-3">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              type="button"
              onClick={handleInstall}
              disabled={installing}
            >
              <Download size={14} />
              {installing ? "Installing…" : "Install App"}
            </Button>
          </div>
        )}

        {/* iOS — step-by-step hint */}
        {showIOS && (
          <ol className="mt-3 space-y-1 text-xs text-tj-muted bg-tj-surface rounded-lg px-3 py-2 list-decimal list-inside leading-relaxed">
            <li>Open this page in <strong className="text-tj-primary">Safari</strong>.</li>
            <li>Tap the <strong className="text-tj-primary">Share</strong> button (□↑).</li>
            <li>Choose <strong className="text-tj-primary">Add to Home Screen</strong>.</li>
            <li>Tap <strong className="text-tj-primary">Add</strong> to confirm.</li>
          </ol>
        )}

        <p className="text-[10px] text-tj-muted mt-2 text-center leading-tight">
          You can always install from <strong>Settings → App</strong>
        </p>
      </div>
    </div>
  );
}
