import React from "react";
import { 
  X, 
  Share2, 
  ChevronLeft, 
  Bookmark, 
  Calendar, 
  Eye,
  Trash2,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  Settings,
  Maximize,
  Captions
} from "lucide-react";
import { useDataStore, type Tutorial } from "../store/useDataStore";

interface Props {
  tutorial: Tutorial;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const VideoDetailModal: React.FC<Props> = ({ tutorial, onClose, onDelete }) => {
  const { tutorials } = useDataStore();

  const upcomingTutorials = tutorials
    .filter(t => t.id !== tutorial.id)
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-50">
      <div className="w-full max-w-[1400px] min-h-screen p-6 md:p-12 relative">
        {/* Header / Breadcrumbs */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
          >
            <ChevronLeft size={18} />
            Back to Tutorials
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold text-sm">{tutorial.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {/* Video Player Container */}
            <div className="rounded-[32px] overflow-hidden bg-slate-900 shadow-2xl aspect-video relative group cursor-pointer">
              {/* Background Thumbnail */}
              <img 
                src={tutorial.thumbnail} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                alt={tutorial.title}
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

              {/* Center Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#ED1B24]/20 group-hover:border-[#ED1B24]/40 transition-all duration-500">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl">
                    <Play className="text-slate-900 ml-1" fill="currentColor" size={28} />
                  </div>
                </div>
              </div>

              <div className="absolute top-0 inset-x-0 p-8 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex flex-col">
                  <h3 className="text-white font-black text-sm">{tutorial.title}</h3>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">Sol Academy</p>
                </div>
              </div>

              {/* Bottom Control Bar */}
              <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 space-y-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                {/* Progress Bar */}
                <div className="relative h-1.5 w-full bg-white/20 rounded-full overflow-hidden group/bar">
                  <div className="absolute left-0 top-0 h-full w-[45%] bg-[#ED1B24] relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#ED1B24] rounded-full border-2 border-white scale-0 group-hover/bar:scale-100 transition-transform" />
                  </div>
                  <div className="absolute left-[45%] top-0 h-full w-[15%] bg-white/40" />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                      <Play size={20} className="text-white fill-white" />
                      <Pause size={20} className="text-white fill-white" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Volume2 size={20} className="text-white" />
                      <div className="w-20 h-1 bg-white/30 rounded-full">
                        <div className="w-2/3 h-full bg-white rounded-full" />
                      </div>
                    </div>
                    <span className="text-white text-xs font-black tracking-wider">
                      04:12 / {tutorial.duration || "12:45"}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    <Captions size={20} className="text-white opacity-60 hover:opacity-100 transition-opacity" />
                    <Settings size={20} className="text-white opacity-60 hover:opacity-100 transition-opacity" />
                    <Maximize size={20} className="text-white opacity-60 hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>

            {/* Video Info Section */}
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-6">
                <h1 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tight">
                  {tutorial.title}
                </h1>
                <div className="flex items-center gap-3 shrink-0 pt-2">
                  <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                    <Bookmark size={20} />
                  </button>
                  <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                    <Share2 size={20} />
                  </button>
                  <button 
                    onClick={() => {
                        if (window.confirm("Delete this video from your library?")) {
                            onDelete(tutorial.id);
                        }
                    }}
                    className="p-3 bg-white border border-red-100 rounded-xl text-red-400 hover:text-red-600 transition-colors shadow-sm"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-slate-500 font-bold">
                  <Calendar size={16} className="text-slate-400" />
                  Updated Oct 24, 2023
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-bold">
                  <Eye size={16} className="text-slate-400" />
                  {(tutorial.views || "1.2k") + " views"}
                </div>
              </div>

              <div className="pt-6 text-lg text-slate-600 leading-relaxed font-medium">
                {tutorial.description}
              </div>

              {/* Key Topics Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  Key topics covered:
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-1 gap-3">
                  {[
                    "Navigating the Sol Analytics dashboard",
                    "Understanding the data schema requirements",
                    "Uploading your historical marketing data via CSV",
                    "Configuring adstock and lag variables"
                  ].map((topic, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600 font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 shrink-0" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-xl shadow-slate-200/50">
              <h2 className="text-xl font-black text-slate-900 mb-8">
                Coming Up Next
              </h2>
              
              <div className="space-y-8">
                {upcomingTutorials.length > 0 ? upcomingTutorials.map((up) => (
                  <div key={up.id} className="flex gap-4 group cursor-pointer group">
                    <div className="relative w-32 shrink-0 aspect-video rounded-xl overflow-hidden bg-slate-100">
                      <img 
                        src={up.thumbnail} 
                        alt={up.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[9px] font-black text-white">
                        {up.duration}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-tight">
                        {up.title}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Next in: Getting Started
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-slate-400 font-medium">
                    No more tutorials in this playlist
                  </div>
                )}
              </div>

              <button className="w-full mt-10 text-[11px] font-black text-red-600 uppercase tracking-widest hover:underline">
                View Full Playlist
              </button>
            </div>

            {/* External Support Link - Re-styled as per image prompt */}
            {tutorial.videoUrl && (
                <a 
                    href={tutorial.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-6 bg-[#4a151b] rounded-[32px] text-white shadow-xl shadow-red-900/20 group hover:bg-[#5a1a21] transition-all"
                >
                    <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest opacity-60">Full Experience</p>
                        <p className="text-lg font-black">Watch on YouTube</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ExternalLink size={24} />
                    </div>
                </a>
            )}
          </div>
        </div>

        {/* Close Button Top Right */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 md:top-12 md:right-12 p-2 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <X size={32} />
        </button>
      </div>
    </div>
  );
};

export default VideoDetailModal;
