import { useEffect, useState } from "react";
import { Download, ExternalLink, X } from "lucide-react";
import Button from "../ui/Button.jsx";
import { usePWA } from "../../hooks/usePWA.js";

const DISMISSED_KEY = "tj:pwa-install-dismissed";
const IS_IOS =
  /iPad|iPhone|iPod/.test(navigator.platform) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export default function InstallPrompt({ dismissible = true }) {
  const { canInstall, isInstalled, isStandalone, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  const isIosStandaloneEligible = IS_IOS && !isStandalone;

  useEffect(() => {
    if (dismissible) {
      const stored = localStorage.getItem(DISMISSED_KEY);
      setDismissed(stored === "1");
    }
  }, [dismissible]);

  const show = canInstall && !isInstalled && !isStandalone && !dismissed;

  const handleDismiss = () => {
    setDismissed(true);
    if (dismissible) localStorage.setItem(DISMISSED_KEY, "1");
  };

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await installApp();
    setInstalling(false);
    if (!accepted) {
      setDismissed(true);
      if (dismissible) localStorage.setItem(DISMISSED_KEY, "1");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-80 z-[60] lg:bottom-6">
      <div className="bg-tj-card border border-tj-medium rounded-xl p-4 shadow-modal">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-tj-accent-soft text-tj-accent shrink-0 mt-0.5">
            <Download size={18} strokeWidth={2} />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <h3 className="text-sm font-semibold text-tj-primary">Install Trade Journal</h3>
            <p className="text-tj-secondary text-xs mt-1 leading-relaxed">
              {isIosStandaloneEligible
                ? "Use Safari's Share button and choose \"Add to Home Screen\"."
                : "Install as an app for faster access and offline support."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-tj-muted hover:text-tj-primary transition-colors p-1 rounded-lg hover:bg-tj-surface flex-shrink-0"
            aria-label="Dismiss install prompt"
          >
            <X size={14} />
          </button>
        </div>
        {!IS_IOS && (
          <div className="mt-3">
            <Button variant="primary" size="sm" className="w-full" type="button" onClick={handleInstall} disabled={installing}>
              <Download size={14} />
              {installing ? "Installing…" : "Install App"}
            </Button>
          </div>
        )}
        {IS_IOS && (
          <div className="mt-3 flex items-center gap-2 text-xs text-tj-muted bg-tj-surface rounded-lg px-3 py-2">
            <ExternalLink size={12} className="shrink-0" />
            <span>Open in Safari → Share → Add to Home Screen.</span>
          </div>
        )}
      </div>
    </div>
  );
}
