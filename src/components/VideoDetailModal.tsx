import React, { useEffect, useState } from "react";
import { 
  X, 
  Share2, 
  ChevronLeft, 
  Bookmark, 
  Calendar, 
  Eye,
  Trash2,
  ExternalLink
} from "lucide-react";
import { useDataStore, type Tutorial } from "../store/useDataStore";

interface Props {
  tutorial: Tutorial;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function extractYouTubeId(url: string) {
  if (!url) return null;
  const m =
    url.match(/[?&]v=([\w-]+)/) ||
    url.match(/youtu\.be\/([\w-]+)/) ||
    url.match(/embed\/([\w-]+)/);
  return m ? m[1] : null;
}

export const VideoDetailModal: React.FC<Props> = ({ tutorial, onClose, onDelete }) => {
  const { tutorials } = useDataStore();
  const [description, setDescription] = useState<string | null>(tutorial.description || null);
  const [views, setViews] = useState<string | null>(tutorial.views || null);
  const [loading, setLoading] = useState(false);

  const videoId = tutorial.videoUrl ? extractYouTubeId(tutorial.videoUrl) : null;

  // Filter out current tutorial for the sidebar
  const upcomingTutorials = tutorials
    .filter(t => t.id !== tutorial.id)
    .slice(0, 5);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      if (!videoId) return;
      setLoading(true);
      const key = (import.meta.env as ImportMetaEnv).VITE_YOUTUBE_API_KEY;
      try {
        if (key) {
          const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${key}`;
          const res = await fetch(url);
          const data = await res.json();
          if (!mounted) return;
          const item = data.items && data.items[0];
          if (item) {
            setDescription(item.snippet.description || description);
            setViews(item.statistics?.viewCount ? Intl.NumberFormat().format(item.statistics.viewCount) : null);
          }
        }
      } catch {
        // ignore errors
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, [videoId, tutorial.videoUrl, description]);

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
            <div className="rounded-[32px] overflow-hidden bg-slate-900 shadow-2xl aspect-video relative">
              {videoId ? (
                <iframe
                  title={tutorial.title}
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  className="absolute inset-0 w-full h-full border-0"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <p>No embeddable video URL</p>
                </div>
              )}
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
                  {loading ? "..." : (views || tutorial.views || "1.2k") + " views"}
                </div>
              </div>

              <div className="pt-6 text-lg text-slate-600 leading-relaxed font-medium">
                {description || tutorial.description}
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
