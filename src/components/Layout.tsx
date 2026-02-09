import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  activePage?: string;
  onNavigate?: (page: any) => void;
}

export const Layout = ({ children, activePage }: LayoutProps) => {
  const isFullWidthArgs = ['connect', 'optimize'];
  const isFullWidth = activePage && isFullWidthArgs.includes(activePage);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isFullWidth ? (
           children
        ) : (
           <div className="flex-1 overflow-y-auto">
             <div className="container mx-auto p-8 max-w-7xl">
               {children}
             </div>
           </div>
        )}
      </main>
    </div>
  );
};
