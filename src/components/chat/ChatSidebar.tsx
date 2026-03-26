import React from 'react';
import { Search, MessageSquare, Trash2, ChevronRight, Plus } from 'lucide-react';
import { type ChatSession } from '../../store/useDataStore';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onDeleteHistory: (id: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
  onClearAll: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  setActiveSessionId,
  searchQuery,
  setSearchQuery,
  onDeleteHistory,
  onNewChat,
  onClearAll,
}) => {
  return (
    <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50 min-h-0 backdrop-blur-3xl">
      <div className="pt-10 px-6 mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#450a0a] transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search history..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-1">
        <h3 className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recent Chats</h3>
        {sessions
          .filter(session => session.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((session) => (
          <div 
            key={session.id} 
            onClick={() => setActiveSessionId(session.id)}
            className={`w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white hover:shadow-sm text-left group transition-all cursor-pointer ${
                activeSessionId === session.id ? 'bg-white shadow-sm ring-1 ring-slate-200' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={16} className={`${activeSessionId === session.id ? 'text-[#871F1E]' : 'text-slate-400'}`} />
              <span className={`text-sm font-medium truncate w-40 ${activeSessionId === session.id ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{session.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                  onClick={(e) => onDeleteHistory(session.id, e)}
                  className="p-1.5 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                  title="Delete conversation"
              >
                  <Trash2 size={14} />
              </button>
              <ChevronRight size={14} className={`text-slate-300 transition-opacity ${activeSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 pt-2 space-y-3">
        <button 
          onClick={onClearAll}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-red-600 hover:bg-red-50 rounded-2xl font-medium transition-all group"
        >
          <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
          <span>Clear All</span>
        </button>

        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#871F1E] hover:bg-[#6d1918] text-white rounded-2xl font-semibold transition-all shadow-lg shadow-brand-primary/20 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>New Chat</span>
        </button>
      </div>
    </div>
  );
};
