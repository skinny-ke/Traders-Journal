import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

export default function Toast({ toast, onDismiss }) {
  const iconType = toast.type === "success" ? "success" : toast.type === "error" ? "error" : "info";
  const Icon = icons[iconType] || Info;

  const variantClasses = {
    success: "bg-tj-profit-soft border border-tj-profit/30 text-tj-profit-dark",
    error: "bg-tj-loss-soft border border-tj-loss/30 text-tj-loss-dark",
    info: "bg-tj-card border-tj-light text-tj-primary",
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-modal animation-fade-in ${variantClasses[toast.type]}`}
      role="status"
    >
      <Icon size={18} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{toast.message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="ml-2 text-tj-muted hover:text-tj-primary transition-colors"
        aria-label="Dismiss notification"
        type="button"
      >
        <X size={16} />
      </button>
    </div>
  );
}
