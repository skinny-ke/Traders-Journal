import { useState, useEffect, useCallback } from "react";

const STANDALONE_QUERY = "(display-mode: standalone)";

export function usePWA() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" && navigator.onLine);
  const [deferredInstallEvent, setDeferredInstallEvent] = useState(null);

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia(STANDALONE_QUERY).matches || window.navigator.standalone === true);

  const handleBeforeInstallPrompt = useCallback((e) => {
    e.preventDefault();
    setDeferredInstallEvent(e);
    setCanInstall(true);
  }, []);

  const handleAppInstalled = useCallback(() => {
    setCanInstall(false);
    setIsInstalled(true);
    setDeferredInstallEvent(null);
  }, []);

  const handleOnline = useCallback(() => setIsOnline(true), []);
  const handleOffline = useCallback(() => setIsOnline(false), []);

  const installApp = useCallback(async () => {
    if (!deferredInstallEvent) return false;
    try {
      const choice = await deferredInstallEvent.prompt();
      return choice.outcome === "accepted";
    } finally {
      setDeferredInstallEvent(null);
      setCanInstall(false);
    }
  }, [deferredInstallEvent]);

  useEffect(() => {
    setIsInstalled(isStandalone);
  }, [isStandalone]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleBeforeInstallPrompt, handleAppInstalled, handleOnline, handleOffline]);

  return {
    canInstall,
    isInstalled,
    isStandalone,
    isOnline,
    installApp,
  };
}

// Service worker registration is handled by vite-plugin-pwa (autoUpdate mode).
// The generated registerSW.js / dist/registerSW.js is injected automatically.
// This exported function is a no-op kept for backwards compatibility with
// the import in main.jsx so we don't need to touch multiple files.
export function registerSW() {
  // No manual registration needed — vite-plugin-pwa handles this.
}
