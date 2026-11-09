import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { usePWA } from "../../hooks/usePWA.js";

export default function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowing(true);
      const timer = setTimeout(() => setShowing(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showing || isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-[60]">
      <div className="bg-amber-900/90 border border-amber-500/30 text-amber-100 px-4 py-2.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center gap-2.5">
        <WifiOff size={16} strokeWidth={2} />
        <span className="text-sm font-medium">You appear to be offline.</span>
        <span className="text-xs ml-2 opacity-80">Adding, editing, or deleting trades requires an internet connection.</span>
      </div>
    </div>
  );
}
