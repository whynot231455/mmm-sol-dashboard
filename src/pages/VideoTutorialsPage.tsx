import { useState, useMemo } from "react";
import {
  Search,
  Link as LinkIcon,
  Upload,
  Play,
  Clock,
  CheckCircle2,
  X,
  Plus,
  Youtube,
} from "lucide-react";
import VideoDetailModal from "../components/VideoDetailModal";
import { useDataStore, type Tutorial } from "../store/useDataStore";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VideoTutorialsPage = () => {
  const { tutorials, addTutorial, deleteTutorial } =
    useDataStore();
  const [searchQuery, setSearchQuery] = useState("");

  // UI States
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(
    null,
  );

  // Form States
  const [ytUrl, setYtUrl] = useState("");
  const [ytTitle, setYtTitle] = useState("");

  const filteredTutorials = useMemo(() => {
    return tutorials.filter((tutorial) => {
      const matchesSearch = tutorial.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [tutorials, searchQuery]);

  const groupedTutorials = useMemo(() => {
    const groups: Record<string, Tutorial[]> = {};
    filteredTutorials.forEach(t => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTutorials]);

  const courseProgress = useMemo(() => {
    if (tutorials.length === 0) return 0;
    const totalProgress = tutorials.reduce((acc, t) => acc + (t.progress || 0), 0);
    return Math.round(totalProgress / tutorials.length);
  }, [tutorials]);

  const handleAddYoutube = () => {
    if (!ytUrl || !ytTitle) return;
    const newTutorial: Tutorial = {
      id: Date.now().toString(),
      title: ytTitle,
      duration: 600, // 10 minutes in seconds
      thumbnail:
        "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop",
      category: "youtube",
      status: "Not Started",
      description: "User linked YouTube video.",
      progress: 0,
      videoUrl: ytUrl,
      views: 0,
    };
    addTutorial(newTutorial);
    setYtUrl("");
    setYtTitle("");
    setIsYouTubeModalOpen(false);
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Academic Program
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Professional Certification in Marketing Mix Modeling
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsYouTubeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
          >
            <LinkIcon size={18} />
            Link Resource
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#ED1B24] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#ED1B24]/20 hover:bg-[#d1171f] transition-all active:scale-95"
          >
            <Upload size={18} />
            Upload Video
          </button>
        </div>
      </div>
      {/* Course Header & Progress */}
      <div className="relative rounded-[40px] bg-slate-900 p-8 lg:p-12 overflow-hidden shadow-2xl shadow-slate-900/20">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#ED1B24]/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#ED1B24]/20 text-[#ED1B24] text-[10px] font-black uppercase tracking-widest rounded-lg border border-[#ED1B24]/30">
                Full Course
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={12} />
                8.5 Hours Total
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-[0.9]">
              Mastering <span className="text-[#ED1B24]">Marketing Mix</span> Modeling
            </h1>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              A comprehensive academic program designed to take you from foundational data theory to advanced Bayesian model deployment.
            </p>
          </div>
          
          <div className="w-full lg:w-72 bg-white/5 backdrop-blur-xl rounded-[32px] p-6 border border-white/10 space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-white uppercase tracking-widest">Course Progress</span>
                <span className="text-xl font-black text-[#ED1B24]">{courseProgress}%</span>
             </div>
             <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#ED1B24] transition-all duration-1000 ease-out shadow-lg shadow-[#ED1B24]/50"
                  style={{ width: `${courseProgress}%` }}
                />
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
               {tutorials.filter(t => t.status === 'Completed').length} of {tutorials.length} lessons finished
             </p>
             <button 
               onClick={() => {
                 const next = tutorials.find(t => t.status !== 'Completed') || tutorials[0];
                 if (next) {
                   setSelectedTutorial(next);
                   setIsDetailOpen(true);
                 }
               }}
               className="w-full py-3 bg-[#ED1B24] text-white rounded-xl font-black text-xs hover:bg-[#ED1B24]/90 transition-all active:scale-95 shadow-lg shadow-[#ED1B24]/20"
             >
               Continue Learning
             </button>
          </div>
        </div>
      </div>

      {/* Curriculum View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Curriculum */}
        <div className="lg:col-span-9 space-y-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <CheckCircle2 size={24} className="text-[#ED1B24]" />
              Course Curriculum
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search lessons..."
                  className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#ED1B24]/10 outline-none transition-all w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {Object.entries(groupedTutorials).map(([category, lessons], groupIdx) => (
            <div key={category} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                  0{groupIdx + 1}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">{category}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lessons.length} Lessons • {lessons.reduce((acc, l) => acc + Math.round(l.duration/60), 0)} min</p>
                </div>
              </div>

              <div className="space-y-3 pl-14">
                {lessons.map((lesson) => (
                  <div 
                    key={lesson.id}
                    onClick={() => {
                      setSelectedTutorial(lesson);
                      setIsDetailOpen(true);
                    }}
                    className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-[#ED1B24]/30 hover:shadow-xl hover:shadow-slate-200/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 shadow-inner border border-slate-50">
                        <img 
                          src={lesson.thumbnail} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90" 
                          alt={lesson.title}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-colors">
                          <Play size={16} className="text-white fill-white shadow-xl" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-[#ED1B24] transition-colors">
                          {lesson.title}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} />
                            {formatDuration(lesson.duration)}
                          </span>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                            lesson.status === 'Completed' ? "bg-emerald-50 text-emerald-600" :
                            lesson.status === 'In Progress' ? "bg-amber-50 text-amber-600" :
                            "bg-slate-50 text-slate-400"
                          )}>
                            {lesson.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <button className="p-2 text-slate-300 hover:text-[#ED1B24] transition-colors">
                          <Plus size={20} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Course Info Sidebar */}
        <div className="lg:col-span-3 space-y-8">

           <div className="p-8 border-2 border-dashed border-slate-100 rounded-[40px] text-center space-y-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                <Youtube size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-900">Add External Content</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
                Link YouTube tutorials or research papers to your curriculum.
              </p>
              <button 
                onClick={() => setIsYouTubeModalOpen(true)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
              >
                Add Resource
              </button>
           </div>
        </div>
      </div>

      {/* Modals remain same as previous attempt but ensures they are exported properly */}
      {isDetailOpen && selectedTutorial && (
        <VideoDetailModal
          tutorial={selectedTutorial}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedTutorial(null);
          }}
          onDelete={(id: string) => {
            deleteTutorial(id);
            setIsDetailOpen(false);
            setSelectedTutorial(null);
          }}
        />
      )}
      {isYouTubeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsYouTubeModalOpen(false)}
          ></div>
          <div className="bg-white rounded-[32px] w-full max-w-md relative z-10 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                  <Youtube className="text-[#ED1B24]" size={24} />
                </div>
                <button
                  onClick={() => setIsYouTubeModalOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Link YouTube Video
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Add tutorials from YouTube to your personal library.
                </p>
              </div>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Video Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Advanced Regression Techniques"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ED1B24]/10 focus:border-[#ED1B24] transition-all"
                    value={ytTitle}
                    onChange={(e) => setYtTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    YouTube URL
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ED1B24]/10 focus:border-[#ED1B24] transition-all"
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                    />
                    <LinkIcon
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleAddYoutube}
                disabled={!ytUrl || !ytTitle}
                className="w-full py-4 bg-[#ED1B24] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#ED1B24]/20 hover:bg-[#d1171f] transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
              >
                Add to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsUploadModalOpen(false)}
          ></div>
          <div className="bg-white rounded-[32px] w-full max-w-md relative z-10 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Upload className="text-[#871F1E]" size={24} />
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Upload Video
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Select an MP4 file from your local machine.
                </p>
              </div>
              <div className="border-2 border-dashed border-slate-100 rounded-[32px] p-12 text-center space-y-3 hover:border-[#871F1E]/30 transition-colors cursor-pointer bg-slate-50/50 group">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                  <Plus size={24} className="text-[#871F1E]" />
                </div>
                <div className="text-xs font-black text-slate-900">
                  Drop files here or click to browse
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  MP4, MOV up to 500MB
                </div>
              </div>
              <div className="bg-[#FACC00]/10 border border-[#FACC00]/20 rounded-2xl p-4 flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FACC00] flex items-center justify-center shrink-0">
                  <Plus size={16} className="text-black rotate-45" />
                </div>
                <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic">
                  Direct uploads are currently in simulation mode. Linked
                  YouTube videos are recommended for full interactive support.
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-full py-4 bg-[#871F1E] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#871F1E]/20 hover:bg-[#a12524] transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
