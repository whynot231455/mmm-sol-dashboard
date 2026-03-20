import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Plus,
  Trash2,
  Search, 
  MessageSquare, 
  MoreVertical,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Star
} from "lucide-react";
import { useDataStore } from "../store/useDataStore";
import { useMeasureData } from "../hooks/useMeasureData";
import { usePredictData } from "../hooks/usePredictData";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    lastUpdated: number;
}





export const ChatPage: React.FC = () => {
    const { documentation, isLoaded } = useDataStore();
    const measureData = useMeasureData();
    const predictParams = useMemo(() => ({ spendChange: 0, seasonality: 1, excludeOutliers: false }), []);
    const predictData = usePredictData(predictParams);

    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize with a session if empty
    useEffect(() => {
        if (sessions.length === 0) {
            const newSession: ChatSession = {
                id: Date.now().toString(),
                title: "New Conversation",
                messages: [],
                lastUpdated: Date.now(),
            };
            setSessions([newSession]);
            setActiveSessionId(newSession.id);
        }
    }, [sessions]);

    // Load messages when active session changes
    useEffect(() => {
        const activeSession = sessions.find(s => s.id === activeSessionId);
        if (activeSession) {
            setMessages(activeSession.messages);
        }
    }, [activeSessionId, sessions]);

    // Sync messages to current session
    useEffect(() => {
        if (!activeSessionId) return;
        setSessions(prev => prev.map(s => 
            s.id === activeSessionId 
                ? { ...s, messages, lastUpdated: Date.now(), title: s.title === "New Conversation" && messages.length > 0 ? messages.find(m => m.role === 'user')?.content.substring(0, 30) || s.title : s.title }
                : s
        ));
    }, [messages]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    const formatCompactNumber = (num: number) => {
        const formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
        return formatter.format(num);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: inputValue,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);

        try {
            // 1. Prepare Context (RAG - Documentation)
            let context = "";
            const sources: string[] = [];
            
            const queryWords = inputValue.toLowerCase().split(/\s+/);
            
            documentation.forEach(section => {
                section.articles.forEach(article => {
                    const titleLower = article.title.toLowerCase();
                    const tagsLower = article.tags.map(t => t.toLowerCase());
                    
                    // Improved matching: Check if any key terms from the query match the title or tags
                    const isMatch = queryWords.some(word => 
                        (word.length > 3 && titleLower.includes(word)) || 
                        tagsLower.some(tag => tag.includes(word))
                    ) || titleLower.includes(inputValue.toLowerCase()) || 
                    inputValue.toLowerCase().includes("mmm") || 
                    inputValue.toLowerCase().includes("marketing mix modeling");

                    if (isMatch) {
                        context += `\nKnowledge Base: ${article.title}\n${article.abstract}\n${article.content}\n`;
                        sources.push(article.title);
                    }
                });
            });

            // 2. Prepare Data Context (Dashboard Insights)
            if (isLoaded && measureData) {
                context += `\nDashboard Data Summary:\n`;
                context += `- Total Revenue: $${formatCompactNumber(measureData.kpi.revenue)}\n`;
                context += `- Total Spend: $${formatCompactNumber(measureData.kpi.spend)}\n`;
                context += `- ROAS: ${measureData.kpi.roas.toFixed(2)}x\n`;
                context += `- Top Channels: ${measureData.channels.slice(0, 3).map(c => `${c.channel} ($${formatCompactNumber(c.revenue)})`).join(", ")}\n`;
                
                if (predictData) {
                    context += `\nPredicted Insights:\n`;
                    context += `- Forecasted Revenue: $${formatCompactNumber(predictData.metrics.revenue)}\n`;
                    context += `- Forecasted ROAS: ${predictData.metrics.roas.toFixed(2)}x\n`;
                }
                sources.push("Dashboard Metrics");
            }

            // 3. Call Local Model (Ollama)
            const modelName = import.meta.env.VITE_OLLAMA_MODEL || "llama3";
            const prompt = `
                You are a helpful Marketing Assistant for Sol Analytics.
                Answer the user's question using the provided context and data.
                
                Context/Data:
                ${context}

                User Question: ${inputValue}

                Guidelines:
                - BE CONCISE and human-friendly. Use a professional yet conversational tone.
                - NEVER dump raw tables of data unless specifically asked.
                - Use rounded numbers (e.g., $1.2B, $45M) for readability.
                - If the answer comes from the Knowledge Base, mention the source (e.g., "According to the [Article Title]...").
                - If the question is about navigating the dashboard, provide a polite step-by-step summary.
            `;

            const response = await fetch("http://localhost:11434/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: modelName,
                    prompt: prompt,
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama error: ${response.statusText}. Ensure Ollama is running.`);
            }

            const data = await response.json();
            const responseText = data.response;

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: responseText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const err = error as Error;
            console.error("Chat Error:", err);
            const detail = err.message.includes("Failed to fetch") 
                ? " (Make sure Ollama is running and OLLAMA_ORIGINS is set to '*') " 
                : "";
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `I'm sorry, I encountered an error: ${err.message}${detail}.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleDeleteHistory = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this conversation?")) {
            setSessions(prev => prev.filter((s) => s.id !== sessionId));
            if (activeSessionId === sessionId) {
                setActiveSessionId(null);
                setMessages([]);
            }
        }
    };

    const handleDeleteCurrentChat = () => {
        if (window.confirm("Are you sure you want to delete this current chat session?")) {
            if (activeSessionId) {
                setSessions(prev => prev.filter(s => s.id !== activeSessionId));
                setActiveSessionId(null);
                setMessages([]);
            }
        }
    };

    const handleNewChat = () => {
        // If current session is already empty, no need to create a new one
        if (messages.length === 0) return;

        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: "New Conversation",
            messages: [],
            lastUpdated: Date.now(),
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setMessages([]);
    };

  return (
    <div className="flex h-full bg-white overflow-hidden min-h-0 selection:bg-[#450a0a]/10">
      {/* Sidebar - History */}
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
            <button 
              key={session.id} 
              onClick={() => setActiveSessionId(session.id)}
              className={`w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white hover:shadow-sm text-left group transition-all ${
                  activeSessionId === session.id ? 'bg-white shadow-sm ring-1 ring-slate-200' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare size={16} className={`${activeSessionId === session.id ? 'text-[#871F1E]' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium truncate w-40 ${activeSessionId === session.id ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{session.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                    onClick={(e) => handleDeleteHistory(session.id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                    title="Delete conversation"
                >
                    <Trash2 size={14} />
                </button>
                <ChevronRight size={14} className={`text-slate-300 transition-opacity ${activeSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
              </div>
            </button>
          ))}
        </div>

        <div className="p-6">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#871F1E] hover:bg-[#6d1918] text-white rounded-2xl font-semibold transition-all shadow-lg shadow-brand-primary/20 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#fcf9f8] relative min-h-0">

        {/* Header */}
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
                onClick={handleDeleteCurrentChat}
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

        {/* Messages / Welcome */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-[#FAF7F5]/30 flex flex-col">
          {messages.length === 0 ? (
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
                {[
                  { title: "Analyze ROAS", desc: "Compare channel performance", icon: <BarChart3 size={18}/>, prompt: "Can you analyze our ROAS across all channels for the last 30 days?" },
                  { title: "Predict Revenue", desc: "Test spend scenarios", icon: <TrendingUp size={18}/>, prompt: "If we increase our search spend by 20%, what is the predicted revenue impact?" },
                  { title: "MMM Basics", desc: "Learn about models", icon: <Search size={18}/>, prompt: "Explain the basics of Marketing Mix Modeling (MMM)." },
                  { title: "Top Channels", desc: "Identify winners", icon: <Star size={18}/>, prompt: "What are our top 3 highest performing channels right now?" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                        setInputValue(item.prompt);
                        // Using a small timeout to ensure state update if we were to trigger send immediately, 
                        // but usually better to let user see and then press enter or click send.
                    }}
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
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex items-start gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${
                  message.role === 'assistant' 
                    ? 'bg-white text-brand-primary border border-slate-100' 
                    : 'bg-slate-900 text-white'
                }`}>
                  {message.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                </div>
                
                <div className={`max-w-[70%] space-y-2 ${message.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                  <div className={`p-5 rounded-2xl text-sm leading-relaxed ${
                    message.role === 'assistant'
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'
                      : 'bg-[#871F1E] text-white shadow-md rounded-tr-none'
                  }`}>
                    {message.content}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter px-1">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white text-brand-primary border border-slate-100 flex items-center justify-center shadow-sm">
                <Bot size={20} />
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 rounded-tl-none">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 bg-white border-t border-slate-50">
          <div className="max-w-4xl mx-auto flex items-center gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-200 focus-within:ring-4 focus-within:ring-brand-primary/5 focus-within:border-brand-primary/20 transition-all">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask anything about your marketing performance..." 
              className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none text-slate-800"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className={`p-3 rounded-xl transition-all ${
                inputValue.trim() 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:-translate-y-0.5' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
