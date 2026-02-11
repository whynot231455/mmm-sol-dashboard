import React, { useState } from 'react';
import { 
    Search, 
    Home, 
    ChevronRight, 
    Download, 
    Code, 
    MessageSquare, 
    Bell,
    Info,
    ChevronDown
} from 'lucide-react';
import { useDataStore, type DocArticle, type DocSection } from '../store/useDataStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DocumentationPage = () => {
    const { documentation = [] } = useDataStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSectionId, setActiveSectionId] = useState(documentation[0]?.id || '');
    const [activeArticleId, setActiveArticleId] = useState(documentation[0]?.articles[0]?.id || '');

    const activeSection = documentation.find(s => s.id === activeSectionId) || documentation[0];
    const activeArticle = activeSection?.articles.find(a => a.id === activeArticleId) || activeSection?.articles[0];

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* Top Bar / Breadcrumbs */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-8">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
                    <Home size={16} className="hover:text-brand-primary cursor-pointer transition-colors" />
                    <ChevronRight size={14} />
                    <span className="hover:text-brand-primary cursor-pointer transition-colors">Documentation</span>
                    {activeArticle && (
                        <>
                            <ChevronRight size={14} />
                            <span className="text-slate-900">{activeArticle.title}</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary" />
                        <input 
                            type="text" 
                            placeholder="Search documentation..."
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary w-64 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="p-2 text-slate-400 hover:text-brand-secondary transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-secondary rounded-full border-2 border-white"></span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content Area */}
                <div className="lg:col-span-9 space-y-8">
                    {/* Topic Selector */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Topic</span>
                            <div className="relative">
                                <select 
                                    className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-brand-primary cursor-pointer shadow-sm hover:border-slate-300 transition-all"
                                    value={activeSectionId}
                                    onChange={(e) => setActiveSectionId(e.target.value)}
                                >
                                    {documentation.map(section => (
                                        <option key={section.id} value={section.id}>{section.title}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 italic">
                            Last updated: {activeArticle?.lastUpdated}
                        </div>
                    </div>

                    {/* Article Header */}
                    {activeArticle && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                {activeArticle.tags.map(tag => (
                                    <span key={tag} className="px-2.5 py-1 bg-[#FACC00]/10 text-[#871F1E] text-[10px] font-bold uppercase tracking-wider rounded border border-[#FACC00]/20">
                                        {tag}
                                    </span>
                                ))}
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{activeArticle.readingTime}</span>
                            </div>

                            <h1 className="text-4xl font-extrabold text-[#871F1E] tracking-tight leading-tight">
                                {activeArticle.title}
                            </h1>

                            <p className="text-xl text-slate-500 leading-relaxed font-medium">
                                {activeArticle.abstract}
                            </p>

                            <div className="h-px w-full bg-slate-100 my-8"></div>

                            {/* Article Body */}
                            <div className="prose prose-slate max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: activeArticle.content }} className="documentation-content" />
                                
                                {/* Specialized Tip Box based on brand colors */}
                                <div className="mt-10 bg-[#871F1E]/[0.02] border-l-4 border-[#871F1E] rounded-r-2xl p-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Info size={48} className="text-[#871F1E]" />
                                    </div>
                                    <div className="flex gap-4 relative">
                                        <div className="w-10 h-10 rounded-full bg-[#871F1E] flex items-center justify-center shrink-0 shadow-lg shadow-[#871F1E]/20">
                                            <Info size={20} className="text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-[#871F1E] text-sm">Tip: Data Granularity</h4>
                                            <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                                For the most accurate calibration, ensure your sales data is aggregated at a weekly level for at least 2 years of history.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-3 space-y-10">
                    {/* On This Page */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">On This Page</span>
                        <nav className="flex flex-col gap-3">
                            {activeArticle?.onPageLinks.map((link, idx) => (
                                <a 
                                    key={link.id} 
                                    href={`#${link.id}`}
                                    className={cn(
                                        "text-sm font-semibold transition-all hover:translate-x-1 pl-3 border-l-2",
                                        idx === 0 
                                            ? "text-[#ED1B24] border-[#ED1B24]" 
                                            : "text-slate-500 border-transparent hover:text-[#871F1E] hover:border-[#871F1E]/30"
                                    )}
                                >
                                    {link.title}
                                </a>
                            ))}
                        </nav>
                    </div>

                    {/* Resources */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resources</span>
                        <div className="flex flex-col gap-4">
                            <button className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-[#ED1B24] transition-colors group">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-[#ED1B24]/5 transition-colors text-[#F58726]">
                                    <Download size={16} />
                                </div>
                                Sample Dataset
                            </button>
                            <button className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-[#ED1B24] transition-colors group">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-[#ED1B24]/5 transition-colors text-[#F58726]">
                                    <Code size={16} />
                                </div>
                                Python SDK
                            </button>
                            <button className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-[#ED1B24] transition-colors group">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-[#ED1B24]/5 transition-colors text-[#F58726]">
                                    <MessageSquare size={16} />
                                </div>
                                Community Forum
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .documentation-content h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                }
                .documentation-content p {
                    margin-bottom: 1.25rem;
                }
                .documentation-content ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin-bottom: 1.25rem;
                    color: #475569;
                }
                .documentation-content li {
                    margin-bottom: 0.5rem;
                }
                .documentation-content strong {
                    color: #0f172a;
                }
            `}} />
        </div>
    );
};
