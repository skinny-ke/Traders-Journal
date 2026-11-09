import { useToast } from "../../context/ToastContext.jsx";
import Toast from "./Toast";

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={() => dismiss(toast.id)} />
        </div>
      ))}
    </div>
  );
}
