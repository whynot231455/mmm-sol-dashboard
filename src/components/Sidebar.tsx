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
  FlaskConical,
  Video,
  BookOpen,
  Workflow,
  MessageSquare,
  Menu,
  X,
  PanelLeftClose,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useDataStore } from "../store/useDataStore";
import type { PageType } from "../store/useDataStore";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const SidebarItem = ({ icon, label, isActive, onClick, compact }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center rounded-xl cursor-pointer transition-all duration-200 outline-none text-left group",
      compact ? "justify-center px-3 py-2.5" : "gap-3 px-4 py-2.5",
      isActive
        ? "bg-[#4a151b] text-white shadow-md"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    )}
  >
    <div
      className={cn(
        "flex-shrink-0 transition-colors",
        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600",
      )}
    >
      {icon}
    </div>
    {!compact && (
      <span
        className={cn(
          "font-semibold text-sm",
          isActive ? "text-white" : "text-slate-700",
        )}
      >
        {label}
      </span>
    )}
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
  const { activePage, setActivePage, isProcessing } = useDataStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sections = [
    {
      title: "Dashboard",
      items: [
        {
          id: "measure" as PageType,
          label: "Measure",
          icon: <BarChart3 size={18} />,
        },
        {
          id: "predict" as PageType,
          label: "Predict",
          icon: <TrendingUp size={18} />,
        },
        {
          id: "optimize" as PageType,
          label: "Optimize",
          icon: <Settings2 size={18} />,
        },
        {
          id: "chat" as PageType,
          label: "Chat",
          icon: <MessageSquare size={18} />,
        },
      ],
    },
    {
      title: "Data",
      items: [
        {
          id: "import" as PageType,
          label: "Import",
          icon: <Upload size={18} />,
        },
        {
          id: "connect" as PageType,
          label: "Connect",
          icon: <Link2 size={18} />,
        },
        {
          id: "transform" as PageType,
          label: "Transform",
          icon: <FileJson size={18} />,
        },
      ],
    },
    {
      title: "Model",
      items: [
        {
          id: "pipelines" as PageType,
          label: "Pipelines",
          icon: <Workflow size={18} />,
        },
        { id: "train" as PageType, label: "Train", icon: <Brain size={18} /> },
        {
          id: "validate" as PageType,
          label: "Validate",
          icon: <CheckCircle2 size={18} />,
        },
        {
          id: "calibrate" as PageType,
          label: "Calibrate",
          icon: <Target size={18} />,
        },
        {
          id: "geolift" as PageType,
          label: "GeoLift",
          icon: <FlaskConical size={18} />,
        },
      ],
    },
    {
      title: "Learn",
      items: [
        {
          id: "video-tutorials" as PageType,
          label: "Video Tutorials",
          icon: <Video size={18} />,
        },
        {
          id: "documentation" as PageType,
          label: "Documentation",
          icon: <BookOpen size={18} />,
        },
      ],
    },
  ];

  const handleNavigate = (page: PageType) => {
    setActivePage(page);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <>
      <div className={cn("px-4 py-3", isCollapsed && "lg:px-3")}>
        <div className={cn("flex items-start", isCollapsed ? "lg:justify-center" : "justify-between gap-3")}>
          <div className={cn("min-w-0", isCollapsed && "lg:flex lg:justify-center")}>
            <img
              src="/sol_analytics_logo.jpg"
              alt="Sol Analytics"
              className={cn("w-auto object-contain", isCollapsed ? "h-14" : "h-22")}
            />
            {!isCollapsed && (
              <div className="mt-1 px-1 text-center">
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">
                  MMM Dashboard
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCollapsed((current) => !current)}
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeftClose className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
            </button>
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className={cn("flex-1 overflow-y-auto px-3 pb-6 scrollbar-hide", isCollapsed && "lg:px-2")}>
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            {!isCollapsed && <SidebarSection title={section.title} />}
            {isCollapsed && <div className="mt-4" />}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  compact={isCollapsed}
                  isActive={activePage === item.id}
                  onClick={() => handleNavigate(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {isProcessing && (
        <div className={cn("px-4 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500", isCollapsed && "px-2")}>
          <div className={cn(
            "bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex flex-col gap-2",
            isCollapsed && "items-center"
          )}>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Loader2 size={14} className="text-brand-primary animate-spin" />
                <div className="absolute inset-0 bg-brand-primary/20 rounded-full animate-ping opacity-50" />
              </div>
              {!isCollapsed && <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Model Training</span>}
            </div>
            {!isCollapsed && <div className="h-1 w-full bg-indigo-100 rounded-full overflow-hidden">
               <div className="h-full bg-brand-primary animate-[shimmer_2s_infinite_linear] w-[60%]" style={{
                 background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                 backgroundSize: '200% 100%'
               }} />
            </div>}
          </div>
        </div>
      )}

      <div className={cn("border-t border-slate-100 p-4", isCollapsed ? "lg:px-3" : "space-y-3")}>

        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3 px-2")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#4a151b] to-[#871F1E] text-xs font-black text-white shadow-sm">
            JD
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                Jane Doe
              </p>
              <p className="text-xs text-slate-500 truncate">Data Scientist</p>
            </div>
          )}
        </div>
        <button
          onClick={() => handleNavigate("login")}
          className={cn(
            "flex items-center rounded-xl px-4 py-2 text-xs font-black text-slate-500 transition-all uppercase tracking-widest hover:text-brand-primary hover:bg-brand-primary/5",
            isCollapsed ? "w-10 justify-center px-0 lg:mx-auto" : "w-full gap-3",
          )}
          aria-label="Logout"
        >
          <div className="flex-shrink-0">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </div>
          {!isCollapsed && "Logout"}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-primary">
              Sol Analytics
            </p>
            <p className="text-[11px] font-semibold text-slate-400">
              MMM Dashboard
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#4a151b]/5" />
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/35 transition-opacity duration-300 lg:hidden",
          isMobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 lg:static lg:z-40 lg:h-screen lg:translate-x-0 lg:shadow-none",
          isCollapsed ? "lg:w-[88px]" : "lg:w-[240px]",
          isMobileOpen ? "translate-x-0 w-[86vw] max-w-[320px]" : "-translate-x-full w-[86vw] max-w-[320px]",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
