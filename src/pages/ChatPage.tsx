import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useDataStore } from "../store/useDataStore";

const DEMO_MESSAGES = [
  { id: "1", role: "user" as const, content: "What was our best performing channel last quarter?" },
  { id: "2", role: "assistant" as const, content: "Based on the current dataset, **Google Search** was your best performing channel with a ROAS of **4.2x** and total revenue of **$1.24M**. Facebook Ads followed closely at 3.8x ROAS." },
  { id: "3", role: "user" as const, content: "Can you predict Q4 revenue if we increase spend by 15%?" },
  { id: "4", role: "assistant" as const, content: "With a 15% increase in spend, our model predicts a Q4 revenue of **$3.85M**, representing a **+12.4% lift** over the baseline forecast. The confidence interval is 95%." },
];

export const ChatPage: React.FC = () => {
  const { setActivePage } = useDataStore();
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now().toString(), role: "user" as const, content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a demo response. In the full version, I would analyze your MMM data and provide actionable insights based on the trained model."
      }]);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#fcf9f8] relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-10 pb-5 border-b border-slate-100 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 rounded-2xl flex items-center justify-center shadow-sm border border-brand-primary/10">
            <Sparkles size={22} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Sol AI Assistant</h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Marketing Intelligence Engine</p>
          </div>
        </div>
        <button
          onClick={() => setActivePage('measure')}
          className="px-4 py-2 text-xs font-black text-slate-400 hover:text-brand-primary border border-transparent hover:border-brand-primary/10 hover:bg-brand-primary/5 rounded-xl transition-all uppercase tracking-widest"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-24 py-8 space-y-8 scroll-smooth custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-brand-primary to-[#5C1010] text-white border-brand-primary/20' 
                : 'bg-white text-slate-600 border-slate-100'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[85%] md:max-w-[75%] rounded-[24px] px-6 py-4 text-[15px] leading-relaxed shadow-sm ${
              msg.role === 'user'
                ? 'bg-brand-primary text-white rounded-tr-none'
                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
            }`}>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\n/g, '<br />')
                  .replace(/\*\*(.*?)\*\*/g, msg.role === 'user' ? '<strong class="text-white font-black">$1</strong>' : '<strong class="text-brand-primary font-black">$1</strong>')
              }} />
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4 animate-in fade-in duration-300">
            <div className="w-9 h-9 rounded-2xl bg-white border border-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-slate-100 rounded-[24px] rounded-tl-none px-6 py-4 shadow-sm">
              <div className="flex gap-1.5 py-1">
                <div className="w-2 h-2 bg-brand-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-brand-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-brand-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input Container */}
      <div className="px-4 md:px-8 lg:px-24 py-6 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-5xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary/20 to-brand-primary/5 rounded-[28px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
          <div className="relative flex items-center gap-3 bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-[24px] px-5 py-4 transition-all focus-within:border-brand-primary/30">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message here..."
              className="flex-1 bg-transparent text-[15px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-11 h-11 bg-brand-primary text-white rounded-2xl flex items-center justify-center hover:bg-[#5C1010] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20 active:scale-95"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
