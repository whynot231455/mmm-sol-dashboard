import React, { useState, useMemo } from 'react';
import { 
    Search, 
    Link as LinkIcon, 
    Upload, 
    Play, 
    Clock, 
    CheckCircle2,
    X,
    Filter,
    Plus,
    Youtube
} from 'lucide-react';
import { useDataStore, type Tutorial } from '../store/useDataStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const VideoTutorialsPage = () => {
    const { tutorials, addTutorial, updateTutorialProgress } = useDataStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('All');
    const [selectedDuration, setSelectedDuration] = useState('All');
    
    // UI States
    const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    
    // Form States
    const [ytUrl, setYtUrl] = useState('');
    const [ytTitle, setYtTitle] = useState('');

    const topics = useMemo(() => ['All', ...Array.from(new Set(tutorials.map(t => t.description.split(' ')[0] || 'General')))], [tutorials]);
    const durations = ['All', '< 5 min', '5-15 min', '> 15 min'];

    const filteredTutorials = useMemo(() => {
        return tutorials.filter(tutorial => {
            const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTopic = selectedTopic === 'All' || tutorial.description.toLowerCase().includes(selectedTopic.toLowerCase());
            
            let matchesDuration = true;
            const minsString = tutorial.duration.split(':')[0];
            const mins = parseInt(minsString);
            if (selectedDuration === '< 5 min') matchesDuration = mins < 5;
            else if (selectedDuration === '5-15 min') matchesDuration = mins >= 5 && mins <= 15;
            else if (selectedDuration === '> 15 min') matchesDuration = mins > 15;

            return matchesSearch && matchesTopic && matchesDuration;
        });
    }, [tutorials, searchQuery, selectedTopic, selectedDuration]);

    const featuredTutorial = useMemo(() => tutorials[0], [tutorials]);

    const handleAddYoutube = () => {
        if (!ytUrl || !ytTitle) return;
        const newTutorial: Tutorial = {
            id: Date.now().toString(),
            title: ytTitle,
            duration: '10:00', // Mock duration
            thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop',
            type: 'youtube',
            status: 'Not Started',
            description: 'User linked YouTube video.',
            progress: 0,
            videoUrl: ytUrl,
            views: '0'
        };
        addTutorial(newTutorial);
        setYtUrl('');
        setYtTitle('');
        setIsYouTubeModalOpen(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Video Tutorials</h1>
                    <p className="text-slate-500 mt-1 font-medium">Mastering MMM with Sol Analytics</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsYouTubeModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <LinkIcon size={18} />
                        Link YouTube Video
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

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#871F1E] transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search tutorials by concept or keyword..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#871F1E]/10 focus:border-[#871F1E] transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none min-w-[120px]">
                        <select 
                            className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none hover:border-slate-300 transition-all cursor-pointer shadow-sm"
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                        >
                            <option value="All">Topic: All</option>
                            {topics.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1 md:flex-none min-w-[140px]">
                        <select 
                            className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none hover:border-slate-300 transition-all cursor-pointer shadow-sm"
                            value={selectedDuration}
                            onChange={(e) => setSelectedDuration(e.target.value)}
                        >
                            <option value="All">Duration: All</option>
                            {durations.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {tutorials.length === 0 ? (
                <div className="bg-white rounded-[32px] border-2 border-dashed border-slate-100 p-24 text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Play size={32} className="text-slate-200 ml-1" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">No tutorials yet</h2>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2 font-medium">Link a YouTube video or upload your own to start building your MMM knowledge library.</p>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={() => setIsYouTubeModalOpen(true)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
                            Add First Video
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Featured Tutorial */}
                    {featuredTutorial && !searchQuery && selectedTopic === 'All' && selectedDuration === 'All' && (
                        <div className="bg-white rounded-[32px] border border-slate-50 shadow-xl shadow-slate-200/40 overflow-hidden group">
                            <div className="flex flex-col lg:flex-row">
                                <div className="lg:w-1/2 relative bg-slate-900 overflow-hidden">
                                    <img 
                                        src={featuredTutorial.thumbnail} 
                                        className="w-full h-full object-cover aspect-video lg:aspect-auto opacity-70 group-hover:scale-105 transition-transform duration-700"
                                        alt={featuredTutorial.title}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <button 
                                            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform"
                                            onClick={() => updateTutorialProgress(featuredTutorial.id, Math.min(featuredTutorial.progress + 10, 100))}
                                        >
                                            <Play size={32} className="text-[#871F1E] fill-[#871F1E] ml-1" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-6 left-6 flex items-center gap-3">
                                        <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[11px] font-black text-white">
                                            {featuredTutorial.duration}
                                        </div>
                                        <div className="px-3 py-1 bg-[#F58726] rounded-lg text-[11px] font-black text-white">
                                            {featuredTutorial.views || '1.2k'} VIEWS
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:w-1/2 p-10 lg:p-14 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-[#871F1E]/5 text-[#871F1E] text-[10px] font-black uppercase tracking-widest rounded-lg border border-[#871F1E]/10 font-sans">Featured</span>
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{featuredTutorial.status}</span>
                                    </div>
                                    <h2 className="text-3xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight font-sans">
                                        {featuredTutorial.title}
                                    </h2>
                                    <p className="text-slate-500 font-medium leading-relaxed text-lg font-sans">
                                        {featuredTutorial.description}
                                    </p>
                                    <div className="pt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex -space-x-2">
                                                {[1,2,3].map(i => (
                                                    <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                                                        <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="user" />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#f58726]" style={{ width: `${featuredTutorial.progress}%` }} />
                                            </div>
                                        </div>
                                        <button 
                                            className="flex items-center gap-2 px-8 py-4 bg-[#42201E] text-white rounded-2xl text-sm font-black shadow-xl shadow-[#42201E]/20 hover:bg-[#5a2b29] transition-all group/btn active:scale-95"
                                            onClick={() => updateTutorialProgress(featuredTutorial.id, Math.min(featuredTutorial.progress + 10, 100))}
                                        >
                                            Watch Now
                                            <Play size={16} className="fill-white group-hover/btn:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Uploads */}
                    <div className="space-y-6 pt-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-[0.1em]">Recent Uploads</h2>
                            <button className="text-[11px] font-black text-[#ED1B24] uppercase tracking-widest hover:underline px-4 py-2 bg-[#ED1B24]/5 rounded-lg transition-all">View all</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredTutorials.map((tutorial) => (
                                <div key={tutorial.id} className="group bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 overflow-hidden flex flex-col h-full">
                                    <div className="relative aspect-video overflow-hidden">
                                        <img 
                                            src={tutorial.thumbnail} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            alt={tutorial.title}
                                        />
                                        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center">
                                            <button 
                                                onClick={() => updateTutorialProgress(tutorial.id, Math.min(tutorial.progress + 10, 100))}
                                                className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center scale-75 group-hover:scale-100 transition-transform opacity-0 group-hover:opacity-100 border border-white/40 shadow-xl"
                                            >
                                                <Play size={20} className="text-white fill-white ml-0.5" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white">
                                            {tutorial.duration}
                                        </div>
                                        {tutorial.status === 'Completed' && (
                                            <div className="absolute top-3 left-3 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                                                <CheckCircle2 size={14} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="space-y-2 flex-1">
                                            <h3 className="text-sm font-black text-slate-900 leading-tight group-hover:text-[#871F1E] transition-colors line-clamp-2 min-h-[2.5rem]">
                                                {tutorial.title}
                                            </h3>
                                            <p className="text-[11px] font-semibold text-slate-400 line-clamp-2 leading-relaxed h-8">
                                                {tutorial.description}
                                            </p>
                                        </div>
                                        <div className="space-y-3 pt-6">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest pl-0.5">
                                                <span className={cn(
                                                    tutorial.status === 'Completed' ? "text-emerald-500" : 
                                                    tutorial.status === 'In Progress' ? "text-[#F58726]" : "text-slate-400"
                                                )}>{tutorial.status}</span>
                                                <span className="text-slate-400">{tutorial.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full transition-all duration-700 ease-out",
                                                        tutorial.status === 'Completed' ? "bg-emerald-500" : 
                                                        tutorial.status === 'In Progress' ? "bg-[#F58726]" : "bg-slate-200"
                                                    )}
                                                    style={{ width: `${tutorial.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Modals remain same as previous attempt but ensures they are exported properly */}
            {isYouTubeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsYouTubeModalOpen(false)}></div>
                    <div className="bg-white rounded-[32px] w-full max-w-md relative z-10 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                                    <Youtube className="text-[#ED1B24]" size={24} />
                                </div>
                                <button onClick={() => setIsYouTubeModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Link YouTube Video</h3>
                                <p className="text-xs font-semibold text-slate-500">Add tutorials from YouTube to your personal library.</p>
                            </div>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Video Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Advanced Regression Techniques"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ED1B24]/10 focus:border-[#ED1B24] transition-all"
                                        value={ytTitle}
                                        onChange={(e) => setYtTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">YouTube URL</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ED1B24]/10 focus:border-[#ED1B24] transition-all"
                                            value={ytUrl}
                                            onChange={(e) => setYtUrl(e.target.value)}
                                        />
                                        <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
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
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsUploadModalOpen(false)}></div>
                    <div className="bg-white rounded-[32px] w-full max-w-md relative z-10 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                    <Upload className="text-[#871F1E]" size={24} />
                                </div>
                                <button onClick={() => setIsUploadModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Upload Video</h3>
                                <p className="text-xs font-semibold text-slate-500">Select an MP4 file from your local machine.</p>
                            </div>
                            <div className="border-2 border-dashed border-slate-100 rounded-[32px] p-12 text-center space-y-3 hover:border-[#871F1E]/30 transition-colors cursor-pointer bg-slate-50/50 group">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                                    <Plus size={24} className="text-[#871F1E]" />
                                </div>
                                <div className="text-xs font-black text-slate-900">Drop files here or click to browse</div>
                                <div className="text-[10px] font-bold text-slate-400">MP4, MOV up to 500MB</div>
                            </div>
                            <div className="bg-[#FACC00]/10 border border-[#FACC00]/20 rounded-2xl p-4 flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#FACC00] flex items-center justify-center shrink-0">
                                    <Plus size={16} className="text-black rotate-45" />
                                </div>
                                <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic">
                                    Direct uploads are currently in simulation mode. Linked YouTube videos are recommended for full interactive support.
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
