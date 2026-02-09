import React from 'react';
import { 
  LayoutDashboard, 
  Database,
  Layers,
  FlaskConical,
  BarChart3
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useDataStore } from '../store/useDataStore';
import type { PageType } from '../store/useDataStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon, label, isActive, onClick }: SidebarItemProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 outline-none text-left group",
      isActive 
        ? "bg-brand-primary/5 text-brand-primary" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <div className={cn(
      "flex-shrink-0 transition-colors",
      isActive ? "text-brand-primary" : "text-slate-400 group-hover:text-slate-600"
    )}>
      {icon}
    </div>
    <span className={cn(
      "font-semibold text-sm",
      isActive ? "text-brand-primary" : "text-slate-700"
    )}>
      {label}
    </span>
  </button>
);

export const Sidebar = () => {
  const { activePage, setActivePage } = useDataStore();

  const navigationItems = [
    { id: "measure" as PageType, label: "Overview", icon: <LayoutDashboard size={20} /> },
    { id: "import" as PageType, label: "Data", icon: <Database size={20} /> },
    { id: "train" as PageType, label: "Model Building", icon: <Layers size={20} /> },
    { id: "calibrate" as PageType, label: "Calibration", icon: <FlaskConical size={20} /> },
    { id: "predict" as PageType, label: "Reporting", icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="h-screen w-[200px] bg-white border-r border-slate-200 flex flex-col sticky top-0 z-40">
      {/* Header */}
      <div className="px-6 py-6 border-b border-slate-100">
        <h1 className="text-lg font-bold text-slate-900">Sol Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">Enterprise MMM</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigationItems.map((item) => (
          <SidebarItem 
            key={item.id}
            icon={item.icon} 
            label={item.label} 
            isActive={activePage === item.id} 
            onClick={() => setActivePage(item.id)}
          />
        ))}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-slate-600">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">Jane Doe</p>
            <p className="text-xs text-slate-500 truncate">Data Scientist</p>
          </div>
        </div>
      </div>
    </div>
  );
};
