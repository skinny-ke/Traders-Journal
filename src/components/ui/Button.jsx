import { cn } from "../../lib/utils";

export default function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  disabled,
  size = "md",
  ...props
}) {
  const base = "btn-base";
  const variants = {
    primary: "btn-primary",
    outline: "btn-outline",
    ghost: "btn-ghost",
    danger: "btn-danger",
    success: "btn-success",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-2.5 text-base",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
