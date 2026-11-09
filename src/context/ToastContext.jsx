import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = "info", duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const toast = { id, message, type, duration };
    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const success = useCallback((message, duration) => show(message, "success", duration), [show]);
  const error = useCallback((message, duration) => show(message, "error", duration), [show]);

  const value = useMemo(
    () => ({ toasts, show, dismiss, success, error }),
    [toasts, show, dismiss, success, error],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
