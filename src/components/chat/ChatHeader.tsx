import React from 'react';
import { Bot, Trash2, MoreVertical } from 'lucide-react';

interface ChatHeaderProps {
  onDeleteCurrentChat: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onDeleteCurrentChat }) => {
  return (
    <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
          <Bot size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Marketing Assistant</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-medium text-slate-500">System Ready</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
            onClick={onDeleteCurrentChat}
            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all group"
            title="Delete current chat session"
        >
            <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
};
