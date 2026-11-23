import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message, type = "success") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-2), { id, message, type }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl bg-neel-950 px-4 py-3 text-sm text-white shadow-lg"
            style={{ animation: "toast-in .2s ease-out" }}
            role="status"
          >
            {t.type === "error" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ff9b87]" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-haldi-500" />
            )}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-white/60 hover:text-white" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);
