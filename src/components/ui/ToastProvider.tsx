import { Toaster } from 'sonner';

export const ToastProvider = () => {
  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(241, 245, 249, 0.8)',
          boxShadow: '0 10px 40px -10px rgba(15, 23, 42, 0.1)',
          color: '#0f172a',
          fontSize: '14px',
          fontWeight: 600,
          borderRadius: '16px',
        },
        className: 'font-sans',
      }}
    />
  );
};
