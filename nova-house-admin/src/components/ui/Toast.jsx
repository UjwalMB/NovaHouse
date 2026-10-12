import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast-item">
            {toast.type === 'success' && (
              <CheckCircle2 size={16} className="text-[#A58A5C] shrink-0" />
            )}
            {toast.type === 'error' && (
              <AlertCircle size={16} className="text-[#F7C6C6] shrink-0" />
            )}
            {toast.type === 'info' && (
              <Info size={16} className="text-[#A58A5C] shrink-0" />
            )}
            <span className="flex-1 font-sans text-xs">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#9E9990] hover:text-[#F4F1EB] ml-2"
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: (msg) => console.log('Toast:', msg),
      removeToast: () => {},
    };
  }
  return context;
}
