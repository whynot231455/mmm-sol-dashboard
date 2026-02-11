import React, { useState } from 'react';
import { 
    Search, 
    Link as LinkIcon, 
    Upload, 
    Play, 
    ArrowRight,
    CheckCircle2
} from 'lucide-react';
import { useDataStore, type Tutorial } from '../store/useDataStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const VideoTutorialsPage = () => {
    const { tutorials = [] } = useDataStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('All');
    const [selectedDuration, setSelectedDuration] = useState('All');
    const [hideWatched, setHideWatched] = useState(false);

    // Filter tutorials
    const filteredTutorials = tutorials.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTopic = selectedTopic === 'All' || t.topic === selectedTopic;
        const matchesWatched = !hideWatched || !t.isWatched;
        return matchesSearch && matchesTopic && matchesWatched;
    });

    const featuredTutorial = tutorials.find(t => t.isFeatured) || tutorials[0];

    const topics = ['All', ...new Set((tutorials || []).map(t => t.topic))];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Video Tutorials</h1>
                    <p className="text-slate-500 mt-1 font-medium">Mastering MMM with Sol Analytics</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors text-slate-700">
                        <LinkIcon size={18} />
                        Link YouTube Video
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2 bg-brand-secondary text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all shadow-md active:scale-95">
                        <Upload size={18} />
                        Upload Video
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
                <div className="relative flex-1 max-w-xl group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search tutorials by concept or keyword..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <select 
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 outline-none focus:border-brand-primary transition-all cursor-pointer shadow-sm hover:border-slate-300"
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                        >
                            <option value="All">Topic</option>
                            {topics.filter(t => t !== 'All').map(topic => (
                                <option key={topic} value={topic}>{topic}</option>
                            ))}
                        </select>

                        <select 
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 outline-none focus:border-brand-primary transition-all cursor-pointer shadow-sm hover:border-slate-300"
                            value={selectedDuration}
                            onChange={(e) => setSelectedDuration(e.target.value)}
                        >
                            <option value="All">Duration</option>
                            <option value="Short">Under 5 min</option>
                            <option value="Medium">5-15 min</option>
                            <option value="Long">Over 15 min</option>
                        </select>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only"
                                checked={hideWatched}
                                onChange={() => setHideWatched(!hideWatched)}
                            />
                            <div className={cn(
                                "w-10 h-5 rounded-full transition-colors",
                                hideWatched ? "bg-brand-primary" : "bg-slate-200"
                            )}></div>
                            <div className={cn(
                                "absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform",
                                hideWatched ? "translate-x-5" : ""
                            )}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Hide Watched</span>
                    </label>
                </div>
            </div>

            {/* Featured Video */}
            {featuredTutorial && !searchQuery && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden group">
                    <div className="grid grid-cols-1 lg:grid-cols-12">
                        <div className="lg:col-span-5 relative aspect-video cursor-pointer">
                            <img 
                                src={featuredTutorial.thumbnail || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"} 
                                alt={featuredTutorial.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-brand-primary/10 group-hover:bg-brand-primary/0 transition-all"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                                    <Play fill="#871F1E" stroke="#871F1E" size={24} className="ml-1" />
                                </div>
                            </div>
                            <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/80 text-white text-xs font-bold rounded">
                                {featuredTutorial.duration}
                            </div>
                        </div>
                        <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center gap-4">
                            <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 bg-brand-primary/5 text-brand-primary text-[10px] font-bold uppercase tracking-wider rounded border border-brand-primary/10">Featured</span>
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded">Course</span>
                            </div>
                            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight group-hover:text-brand-primary transition-colors">{featuredTutorial.title}</h2>
                            <p className="text-slate-500 text-base leading-relaxed max-w-xl">
                                {featuredTutorial.description}
                            </p>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-2">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
                                        ))}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-400">{featuredTutorial.views} views</span>
                                </div>
                                <button className="flex items-center gap-2 px-6 py-3 bg-[#3d1313] text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg active:scale-95 group/btn">
                                    Watch Now
                                    <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Uploads Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-3">
                        Recent Uploads
                        {filteredTutorials.length > 0 && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full">{filteredTutorials.length}</span>
                        )}
                    </h2>
                    <button className="text-brand-secondary text-sm font-bold hover:underline">View all</button>
                </div>

                {filteredTutorials.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <Play className="text-slate-300 w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No tutorials found</h3>
                        <p className="text-slate-500 mt-1">Try adjusting your search or filters to find what you're looking for.</p>
                        <button 
                            onClick={() => {setSearchQuery(''); setSelectedTopic('All'); setSelectedDuration('All');}}
                            className="mt-6 text-brand-primary font-bold text-sm hover:underline"
                        >
                            Reset all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredTutorials.map((tutorial) => (
                            <div key={tutorial.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                                <div className="relative aspect-video">
                                    <img 
                                        src={tutorial.thumbnail || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026&auto=format&fit=crop"} 
                                        alt={tutorial.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/10 transition-all"></div>
                                    <div className="absolute top-3 left-3">
                                        {tutorial.isWatched && (
                                            <div className="bg-green-500 p-1 rounded-full text-white shadow-lg">
                                                <CheckCircle2 size={14} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 text-white text-[10px] font-bold rounded">
                                        {tutorial.duration}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                                            <Play fill="#871F1E" stroke="#871F1E" size={18} className="ml-1" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1 gap-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-bold uppercase tracking-wider rounded border border-slate-100">{tutorial.topic}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors">{tutorial.title}</h3>
                                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                                        {tutorial.description}
                                    </p>
                                    
                                    <div className="mt-auto pt-4 flex flex-col gap-2">
                                        <div className="flex items-center justify-between text-[10px] font-bold">
                                            <span className={cn(
                                                tutorial.progress === 100 ? "text-green-500" : 
                                                tutorial.progress > 0 ? "text-brand-third" : "text-slate-400"
                                            )}>
                                                {tutorial.progress === 100 ? "Completed" : 
                                                 tutorial.progress > 0 ? "In Progress" : "Not Started"}
                                            </span>
                                            <span className="text-slate-400">{tutorial.progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div 
                                                className={cn(
                                                    "h-full transition-all duration-1000",
                                                    tutorial.progress === 100 ? "bg-green-500" : 
                                                    tutorial.progress > 0 ? "bg-brand-primary" : "bg-slate-200"
                                                )}
                                                style={{ width: `${tutorial.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
