import React from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  Cpu,
  Zap,
  BarChartHorizontal,
  FileCheck,
  FlaskConical,
  Activity,
  LineChart
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
  isCollapsed?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon, label, isActive, isCollapsed, onClick }: SidebarItemProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 outline-none text-left",
      isActive 
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <div className="flex-shrink-0">{icon}</div>
    {!isCollapsed && <span className="font-medium text-sm truncate">{label}</span>}
  </button>
);

const SectionHeader = ({ label, isCollapsed }: { label: string; isCollapsed: boolean }) => (
  <p className={cn(
    "px-3 mt-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest",
    isCollapsed ? "text-center" : ""
  )}>
    {isCollapsed ? "•••" : label}
  </p>
);

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const { activePage, setActivePage } = useDataStore();

  const sections = [
    {
      label: "Dashboard",
      items: [
        { id: "measure" as PageType, label: "Measure", icon: <LayoutDashboard size={18} /> },
        { id: "predict" as PageType, label: "Predict", icon: <LineChart size={18} /> },
        { id: "optimize" as PageType, label: "Optimize", icon: <Zap size={18} /> },
      ]
    },
    {
      label: "Data",
      items: [
        { id: "import" as PageType, label: "Import", icon: <Upload size={18} /> },
        { id: "connect" as PageType, label: "Connect", icon: <Database size={18} /> },
        { id: "transform" as PageType, label: "Transform", icon: <BarChartHorizontal size={18} /> },
      ]
    },
    {
      label: "Model",
      items: [
        { id: "train" as PageType, label: "Train", icon: <Cpu size={18} /> },
        { id: "validate" as PageType, label: "Validate", icon: <FileCheck size={18} /> },
        { id: "calibrate" as PageType, label: "Calibrate", icon: <FlaskConical size={18} /> },
      ]
    }
  ];

  return (
    <div className={cn(
      "h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out sticky top-0 z-40",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">SOL Analytics</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors",
            isCollapsed && "mx-auto"
          )}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {sections.map((section) => (
          <div key={section.label}>
            <SectionHeader label={section.label} isCollapsed={isCollapsed} />
            {section.items.map((item) => (
              <SidebarItem 
                key={item.id}
                icon={item.icon} 
                label={item.label} 
                isActive={activePage === item.id} 
                isCollapsed={isCollapsed}
                onClick={() => setActivePage(item.id)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100">
        <SidebarItem 
          icon={<Settings size={18} />} 
          label="Settings" 
          isCollapsed={isCollapsed} 
        />
      </div>
    </div>
  );
};
