
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Icons } from '../components/Icons';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-top-2 fade-in duration-300
              ${toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 
                toast.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 
                'bg-white border-gray-100 text-gray-800'}
            `}
          >
             <div className={`shrink-0 ${toast.type === 'error' ? 'text-red-500' : toast.type === 'success' ? 'text-green-500' : 'text-blue-500'}`}>
               {toast.type === 'error' ? <Icons.X /> : toast.type === 'success' ? <Icons.Check /> : <Icons.Flame />}
             </div>
             <p className="text-sm font-medium">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
