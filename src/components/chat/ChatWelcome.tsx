import React from 'react';
import { Bot, BarChart3, TrendingUp, Search, Star } from 'lucide-react';

interface ChatWelcomeProps {
  onSelectPrompt: (prompt: string) => void;
}

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({ onSelectPrompt }) => {
  const suggestItems = [
    { title: "Analyze ROAS", desc: "Compare channel performance", icon: <BarChart3 size={18}/>, prompt: "Can you analyze our ROAS across all channels for the last 30 days?" },
    { title: "Predict Revenue", desc: "Test spend scenarios", icon: <TrendingUp size={18}/>, prompt: "If we increase our search spend by 20%, what is the predicted revenue impact?" },
    { title: "MMM Basics", desc: "Learn about models", icon: <Search size={18}/>, prompt: "Explain the basics of Marketing Mix Modeling (MMM)." },
    { title: "Top Channels", desc: "Identify winners", icon: <Star size={18}/>, prompt: "What are our top 3 highest performing channels right now?" }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full space-y-12 animate-in fade-in zoom-in duration-700">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <div className="absolute -inset-4 bg-brand-primary/10 blur-3xl rounded-full"></div>
          <Bot size={48} className="text-brand-primary relative" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Hi Noel, <span className="text-brand-primary">Where should we start?</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Explore your marketing performance, test "what-if" scenarios, or analyze your ROI data.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {suggestItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className="p-5 bg-white border border-slate-100 rounded-[24px] text-left hover:border-brand-primary/30 hover:shadow-xl hover:shadow-brand-primary/5 transition-all group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/5 transition-colors mb-4">
              {item.icon}
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
              <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
