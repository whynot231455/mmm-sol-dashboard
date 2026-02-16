import { 
  BarChart3,
  TrendingUp,
  Settings2,
  Upload,
  Link2,
  FileJson,
  Brain,
  CheckCircle2,
  Target,
  Video,
  BookOpen
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
      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 outline-none text-left group",
      isActive 
        ? "bg-[#4a151b] text-white shadow-md" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <div className={cn(
      "flex-shrink-0 transition-colors",
      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
    )}>
      {icon}
    </div>
    <span className={cn(
      "font-semibold text-sm",
      isActive ? "text-white" : "text-slate-700"
    )}>
      {label}
    </span>
  </button>
);

const SidebarSection = ({ title }: { title: string }) => (
  <div className="px-4 py-2 mt-4 mb-1">
    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
      {title}
    </span>
  </div>
);

export const Sidebar = () => {
  const { activePage, setActivePage } = useDataStore();

  const sections = [
    {
      title: "Dashboard",
      items: [
        { id: "measure" as PageType, label: "Measure", icon: <BarChart3 size={18} /> },
        { id: "predict" as PageType, label: "Predict", icon: <TrendingUp size={18} /> },
        { id: "optimize" as PageType, label: "Optimize", icon: <Settings2 size={18} /> },
      ]
    },
    {
      title: "Data",
      items: [
        { id: "import" as PageType, label: "Import", icon: <Upload size={18} /> },
        { id: "connect" as PageType, label: "Connect", icon: <Link2 size={18} /> },
        { id: "transform" as PageType, label: "Transform", icon: <FileJson size={18} /> },
      ]
    },
    {
      title: "Model",
      items: [
        { id: "train" as PageType, label: "Train", icon: <Brain size={18} /> },
        { id: "validate" as PageType, label: "Validate", icon: <CheckCircle2 size={18} /> },
        { id: "calibrate" as PageType, label: "Calibrate", icon: <Target size={18} /> },
      ]
    },
    {
      title: "Learn",
      items: [
        { id: "video-tutorials" as PageType, label: "Video Tutorials", icon: <Video size={18} /> },
        { id: "documentation" as PageType, label: "Documentation", icon: <BookOpen size={18} /> },
      ]
    }
  ];

  return (
    <div className="h-screen w-[220px] bg-white border-r border-slate-200 flex flex-col sticky top-0 z-40">
      {/* Header */}
      <div className="px-4 py-3">
        <img 
          src="/sol_analytics_logo.jpg" 
          alt="Sol Analytics" 
          className="h-22 w-auto object-contain"
        />
        <div className="mt-1 px-1 text-center">
          <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">
            MMM Dashboard
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 pb-6 scrollbar-hide">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            <SidebarSection title={section.title} />
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarItem 
                  key={item.id}
                  icon={item.icon} 
                  label={item.label} 
                  isActive={activePage === item.id} 
                  onClick={() => setActivePage(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
            <img src="https://i.pravatar.cc/100?img=32" alt="Jane Doe" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">Jane Doe</p>
            <p className="text-xs text-slate-500 truncate">Data Scientist</p>
          </div>
        </div>
        <button 
          onClick={() => setActivePage('login')}
          className="w-full flex items-center gap-3 px-4 py-2 text-xs font-black text-slate-500 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all uppercase tracking-widest"
        >
          <div className="flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </div>
          Logout
        </button>
      </div>
    </div>
  );
};
