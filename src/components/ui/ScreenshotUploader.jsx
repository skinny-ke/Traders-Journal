import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { resolveScreenshotDisplay } from "../../services/screenshotService.js";
import { hasScreenshot } from "../../lib/tradeMapper.js";

export default function ScreenshotUploader({
  existingScreenshot,
  previewUrl,
  onChange,
  onRemove,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [existingUrl, setExistingUrl] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    let revoked = null;
    let cancelled = false;

    async function load() {
      if (!hasScreenshot(existingScreenshot) || previewUrl) {
        setExistingUrl(null);
        return;
      }
      setLoadingExisting(true);
      try {
        const result = await resolveScreenshotDisplay(existingScreenshot);
        if (cancelled) {
          if (result.objectUrl && result.url) URL.revokeObjectURL(result.url);
          return;
        }
        if (result.objectUrl) revoked = result.url;
        setExistingUrl(result.url);
      } catch {
        if (!cancelled) setExistingUrl(null);
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [existingScreenshot, previewUrl]);

  const activeUrl = previewUrl || existingUrl;
  const label = previewUrl ? "New screenshot selected" : existingScreenshot?.name;

  return (
    <div className="space-y-3">
      {activeUrl ? (
        <div className="relative inline-block">
          <img
            src={activeUrl}
            alt="Trade screenshot preview"
            className="w-full max-w-xs h-40 object-cover rounded-xl border border-tj-light bg-tj-surface"
          />
          {!disabled && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 bg-tj-loss-soft text-tj-loss rounded-full w-7 h-7 flex items-center justify-center hover:bg-tj-loss hover:text-tj-primary transition-colors duration-fast"
              aria-label="Remove screenshot"
            >
              <X size={14} />
            </button>
          )}
          {label && <p className="text-[11px] text-tj-muted mt-1.5 break-all">{label}</p>}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="w-full sm:w-auto border border-tj-light border-dashed rounded-xl bg-tj-surface px-5 py-6 flex flex-col items-center gap-2 hover:border-tj-accent hover:bg-tj-accent-soft transition-colors duration-fast disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <ImageIcon size={22} className="text-tj-muted" />
          <span className="text-sm text-tj-secondary">
            {loadingExisting ? "Loading screenshot…" : "Upload screenshot"}
          </span>
          <span className="text-[11px] text-tj-muted">PNG, JPG, WEBP up to 5 MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          e.target.value = "";
          if (file) onChange(file);
        }}
      />
      {existingScreenshot && !previewUrl && !activeUrl && !loadingExisting && (
        <p className="text-[11px] text-tj-muted">Saved screenshot metadata exists, but the image could not be loaded from local storage.</p>
      )}
    </div>
  );
}
