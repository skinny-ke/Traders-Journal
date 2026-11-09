import { cn } from "../../lib/utils";

export default function Badge({ children, variant = "neutral", className = "" }) {
  const variants = {
    win: "badge-win",
    loss: "badge-loss",
    neutral: "badge-neutral",
    default: "badge bg-tj-card text-tj-primary border-tj-light",
  };

  return <span className={cn(variants[variant], className)}>{children}</span>;
}
