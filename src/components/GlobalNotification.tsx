import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Info, AlertCircle, ArrowRight } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GlobalNotification: React.FC = () => {
  const { notification, setNotification, setActivePage } = useDataStore();
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = React.useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setNotification(null);
    }, 300); // Wait for exit animation
  }, [setNotification]);

  useEffect(() => {
    if (notification) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, 8000); // Auto-dismiss after 8s
      return () => clearTimeout(timer);
    }
  }, [notification, handleClose]);

  const handleAction = () => {
    if (notification?.targetPage) {
      setActivePage(notification.targetPage);
    }
    handleClose();
  };

  if (!notification) return null;

  const icons = {
    success: <CheckCircle2 className="text-green-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
    warning: <AlertCircle className="text-amber-500" size={20} />,
  };

  return (
    <div className={cn(
      "fixed top-6 right-6 z-[100] transition-all duration-500 transform",
      isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
    )}>
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl p-4 min-w-[320px] max-w-md flex items-start gap-4">
        <div className="pt-1">
          {icons[notification.type]}
        </div>
        
        <div className="flex-1 space-y-1">
          <p className="text-sm font-bold text-slate-900 leading-tight">
            {notification.message}
          </p>
          
          {notification.actionLabel && (
            <button 
              onClick={handleAction}
              className="group flex items-center gap-1.5 text-xs font-black text-brand-primary uppercase tracking-wider hover:gap-2 transition-all"
            >
              {notification.actionLabel}
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        <button 
          onClick={handleClose}
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
