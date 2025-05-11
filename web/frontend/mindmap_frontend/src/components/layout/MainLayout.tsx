import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useToast } from '../../contexts/ToastContext';

const MainLayout: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
      
      <footer className="py-4 px-6 border-t border-border">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} LLM マインドマップ</p>
        </div>
      </footer>
      
      {/* トースト表示エリア */}
      {toasts.length > 0 && (
        <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
          {toasts.map(toast => (
            <div 
              key={toast.id}
              className={`p-4 rounded-md shadow-md max-w-md ${
                toast.variant === 'destructive' 
                  ? 'bg-destructive text-destructive-foreground' 
                  : toast.variant === 'success'
                    ? 'bg-green-600 text-white'
                    : toast.variant === 'warning'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-background border'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{toast.title}</div>
                  {toast.description && <div className="text-sm mt-1">{toast.description}</div>}
                </div>
                <button 
                  onClick={() => dismissToast(toast.id)}
                  className="ml-4 text-sm opacity-70 hover:opacity-100"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MainLayout;
