import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import { useToast } from "../../context/ToastContext.jsx";
import { toUserError } from "../../lib/errors.js";
import { cn } from "../../lib/utils.js";
import { useTrades } from "../../hooks/useTrades.js";
import { calculateProfitLoss, determineResult, formatPnL } from "../../lib/tradeCalculator.js";
import { MAX_SCREENSHOT_SIZE } from "../../lib/storage.js";
import { currencySymbol } from "../../lib/currency.js";
import { isValidDateString } from "../../lib/dates.js";
import ScreenshotUploader from "../ui/ScreenshotUploader.jsx";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function initialForm(trade) {
  if (trade) {
    return {
      date: trade.date || "",
      time: trade.time || "",
      instrument: trade.instrument || "",
      direction: trade.direction || "BUY",
      entryPrice: trade.entryPrice ?? "",
      exitPrice: trade.exitPrice ?? "",
      quantity: trade.quantity ?? "",
      notes: trade.notes || "",
    };
  }
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: "",
    instrument: "",
    direction: "BUY",
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    notes: "",
  };
}

function validate(form) {
  const errors = {};
  if (!form.date) errors.date = "Trade date is required.";
  if (!String(form.instrument || "").trim()) errors.instrument = "Instrument is required.";

  const entry = Number(form.entryPrice);
  const exit = Number(form.exitPrice);
  const qty = Number(form.quantity);

  if (!form.entryPrice || !Number.isFinite(entry) || entry <= 0) {
    errors.entryPrice = "Entry price must be a positive number.";
  }
  if (!form.exitPrice || !Number.isFinite(exit) || exit <= 0) {
    errors.exitPrice = "Exit price must be a positive number.";
  }
  if (!form.quantity || !Number.isFinite(qty) || qty <= 0) {
    errors.quantity = "Quantity must be a positive number.";
  }

  if (form.date && !isValidDateString(form.date)) {
    errors.date = "Date must be valid.";
  }

  return errors;
}

export default function TradeForm({ mode = "create", initialTrade = null }) {
  const navigate = useNavigate();
  const { addTrade, editTrade } = useTrades();
  const { success, error: showError } = useToast();

  const [form, setForm] = useState(() => initialForm(initialTrade));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removeExistingScreenshot, setRemoveExistingScreenshot] = useState(false);

  useEffect(() => {
    setForm(initialForm(initialTrade));
    setErrors({});
    setScreenshotFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setRemoveExistingScreenshot(false);
  }, [initialTrade, mode]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const canCalculate = form.entryPrice !== "" && form.exitPrice !== "" && form.quantity !== "";
  const calculatedPnL = useMemo(
    () => (canCalculate ? calculateProfitLoss(form.direction, form.entryPrice, form.exitPrice, form.quantity) : null),
    [canCalculate, form.direction, form.entryPrice, form.exitPrice, form.quantity],
  );
  const result = useMemo(() => (calculatedPnL == null ? null : determineResult(calculatedPnL)), [calculatedPnL]);
  const sym = currencySymbol();

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleScreenshotChange = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      showError("Please upload a PNG, JPG, or WEBP image.", 4000);
      return;
    }
    if (file.size > MAX_SCREENSHOT_SIZE) {
      showError("Screenshot file too large (max 5 MB).", 4000);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setScreenshotFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveExistingScreenshot(false);
  };

  const handleScreenshotRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setScreenshotFile(null);
    setPreviewUrl(null);
    if (mode === "edit" && initialTrade?.screenshot) {
      setRemoveExistingScreenshot(true);
    }
  };

  const handleCancel = () => {
    if (mode === "edit" && initialTrade?.id) {
      navigate(`/trades/${initialTrade.id}`);
    } else {
      navigate("/trades");
    }
  };

  const handleReset = () => {
    setForm(initialForm(mode === "edit" ? initialTrade : null));
    setErrors({});
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setScreenshotFile(null);
    setPreviewUrl(null);
    setRemoveExistingScreenshot(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      showError("Please fix the highlighted fields.", 4000);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        instrument: String(form.instrument).trim(),
        removeScreenshot: removeExistingScreenshot,
      };

      let saved;
      if (mode === "edit") {
        saved = await editTrade(initialTrade.id, payload, screenshotFile);
        success(`Trade for ${saved.instrument} updated successfully.`, 3500);
        navigate(`/trades/${saved.id}`);
      } else {
        saved = await addTrade(payload, screenshotFile);
        success(`Trade for ${saved.instrument} saved successfully.`, 3500);
        navigate(`/trades/${saved.id}`);
      }
    } catch (err) {
      showError(toUserError(err, "Failed to save trade."), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const existingScreenshot = mode === "edit" && !removeExistingScreenshot ? initialTrade?.screenshot : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-tj-primary tracking-tight">{mode === "edit" ? "Edit Trade" : "Add Trade"}</h1>
          <p className="text-tj-secondary text-sm mt-1">
            {mode === "edit" ? "Update trade details and recalculate results." : "Record a new trade manually."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Trade date" htmlFor="trade-date" error={errors.date} required>
            <input
              id="trade-date"
              type="date"
              value={form.date}
              onChange={(e) => setField("date", e.target.value)}
              className={cn(errors.date && "input-error", "input")}
            />
          </Field>

          <Field label="Trade time" htmlFor="trade-time">
            <input
              id="trade-time"
              type="time"
              value={form.time}
              onChange={(e) => setField("time", e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Instrument" htmlFor="trade-instrument" error={errors.instrument} required>
            <input
              id="trade-instrument"
              type="text"
              value={form.instrument}
              onChange={(e) => setField("instrument", e.target.value)}
              placeholder="e.g. EUR/USD, XAU/USD"
              className={cn(errors.instrument && "input-error", "input")}
              list="instrument-suggestions"
              autoComplete="off"
            />
            <datalist id="instrument-suggestions">
              <option value="EUR/USD" />
              <option value="GBP/USD" />
              <option value="USD/JPY" />
              <option value="XAU/USD" />
              <option value="BTC/USD" />
              <option value="NAS100" />
            </datalist>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Direction" required>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Trade direction">
              <button
                type="button"
                onClick={() => setField("direction", "BUY")}
                className={`py-2 rounded-xl border text-sm font-medium transition-all duration-fast ${
                  form.direction === "BUY"
                    ? "bg-tj-accent-soft border-tj-accent text-tj-accent"
                    : "bg-transparent border-tj-light text-tj-muted hover:text-tj-primary hover:bg-tj-surface"
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setField("direction", "SELL")}
                className={`py-2 rounded-xl border text-sm font-medium transition-all duration-fast ${
                  form.direction === "SELL"
                    ? "bg-tj-accent-soft border-tj-accent text-tj-accent"
                    : "bg-transparent border-tj-light text-tj-muted hover:text-tj-primary hover:bg-tj-surface"
                }`}
              >
                SELL
              </button>
            </div>
          </Field>

          <Field label="Entry price" htmlFor="entry-price" error={errors.entryPrice} required>
            <div className="flex items-center gap-2">
              <span className="text-tj-secondary text-sm">{sym}</span>
              <input
                id="entry-price"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={form.entryPrice}
                onChange={(e) => setField("entryPrice", e.target.value)}
                className={`${cn(errors.entryPrice && "input-error", "input")} flex-1`}
              />
            </div>
          </Field>

          <Field label="Exit price" htmlFor="exit-price" error={errors.exitPrice} required>
            <div className="flex items-center gap-2">
              <span className="text-tj-secondary text-sm">{sym}</span>
              <input
                id="exit-price"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={form.exitPrice}
                onChange={(e) => setField("exitPrice", e.target.value)}
                className={`${cn(errors.exitPrice && "input-error", "input")} flex-1`}
              />
            </div>
          </Field>

          <Field label="Quantity" htmlFor="quantity" error={errors.quantity} required>
            <input
              id="quantity"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={form.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
              className={cn(errors.quantity && "input-error", "input")}
            />
          </Field>

          <Field label="Profit / Loss (auto)">
            <div className="rounded-xl border border-tj-light bg-tj-surface px-4 py-3 min-h-[52px] flex flex-col justify-center">
              <span
                className={`financial-lg font-semibold ${
                  calculatedPnL == null
                    ? "text-tj-muted"
                    : calculatedPnL > 0
                      ? "text-tj-profit"
                      : calculatedPnL < 0
                        ? "text-tj-loss"
                        : "text-tj-muted"
                }`}
              >
                {calculatedPnL == null ? "—" : formatPnL(calculatedPnL)}
              </span>
              <span className="text-[11px] text-tj-muted">
                Result:{" "}
                <span className={result === "WIN" ? "text-tj-profit" : result === "LOSS" ? "text-tj-loss" : "text-tj-muted"}>
                  {result || "—"}
                </span>
              </span>
            </div>
          </Field>
        </div>

        <Field label="Screenshot (optional)">
          <ScreenshotUploader
            existingScreenshot={existingScreenshot}
            previewUrl={previewUrl}
            onChange={handleScreenshotChange}
            onRemove={handleScreenshotRemove}
            disabled={submitting}
          />
        </Field>

        <Field label="Personal notes" htmlFor="trade-notes">
          <textarea
            id="trade-notes"
            rows={4}
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="Write your thoughts on this trade..."
            className="input w-full resize-y"
          />
        </Field>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-5 border-t border-tj-light/50">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary px-6 py-2.5"
          >
            <Save size={16} />
            {submitting ? "Saving…" : mode === "edit" ? "Update Trade" : "Save Trade"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="btn-outline px-4 py-2.5 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="btn-ghost px-4 py-2.5 sm:ml-auto disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, htmlFor, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="label">
        {label}
        {required ? <span className="text-tj-loss ml-0.5">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-[11px] text-tj-loss">{error}</p> : null}
    </div>
  );
}
