import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastVariant = 'default' | 'destructive' | 'success' | 'warning';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (props: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ 
    title, 
    description, 
    variant = 'default', 
    duration = 3000 
  }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, description, variant, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismissToast }}>
      {children}
      
      {/* トースト表示エリア */}
      {toasts.length > 0 && (
        <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
          {toasts.map(t => (
            <div 
              key={t.id}
              className={`p-4 rounded-md shadow-md max-w-md ${
                t.variant === 'destructive' 
                  ? 'bg-destructive text-destructive-foreground' 
                  : t.variant === 'success'
                    ? 'bg-green-600 text-white'
                    : t.variant === 'warning'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-background border'
              }`}
            >
              <div className="font-medium">{t.title}</div>
              {t.description && <div className="text-sm mt-1">{t.description}</div>}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
