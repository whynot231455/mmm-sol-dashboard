import React from 'react';
import { Bot, User, CheckCircle, Circle, Loader2, XCircle, ExternalLink, Navigation } from 'lucide-react';
import { useDataStore, type ChatAttachment, type Message, type PageType } from '../../store/useDataStore';
import { type AgentTask } from '../../types/agent';
import { MessageContent } from './MessageContent';

interface ChatMessageListProps {
  messages: Message[];
  task: AgentTask | null;
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onPreviewAttachment: (attachment: ChatAttachment) => void;
}

interface MessageSource {
  name: string;
  link: string;
}

const isPageRoute = (link: string): link is `/${PageType}` => link.startsWith('/');

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  task,
  isTyping,
  messagesEndRef,
  onPreviewAttachment,
}) => {
  const { setActivePage } = useDataStore();

  const parseSources = (content: string) => {
    // Regex to find Sources: followed by a JSON array, even if there's markdown around it
    const match = content.match(/Sources:\s*(\[[\s\S]*?\])/i);
    if (!match) return { cleanContent: content, sources: [] };

    try {
      // Find the last ] to ensure we get the whole array if there's trailing garbage
      const jsonStr = match[1].trim();
      const sources = JSON.parse(jsonStr) as MessageSource[];
      const cleanContent = content.replace(match[0], '').trim();
      
      return { cleanContent, sources: Array.isArray(sources) ? sources : [] };
    } catch (error) {
      console.warn('Failed to parse sources JSON:', error, match[1]);
      return { cleanContent: content, sources: [] };
    }
  };

  const handleSourceClick = (link: string) => {
    if (isPageRoute(link)) {
      setActivePage(link.slice(1) as PageType);
    } else {
      window.open(link, '_blank');
    }
  };
  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-[#FAF7F5]/30 flex flex-col">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex items-start gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${
              message.role === 'assistant'
                ? 'bg-white text-brand-primary border border-slate-100'
                : 'bg-slate-900 text-white'
            }`}
          >
            {message.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
          </div>

          <div className={`max-w-[70%] space-y-2 ${message.role === 'user' ? 'items-end flex flex-col' : ''}`}>
            <div
              className={`p-5 rounded-2xl text-sm leading-relaxed ${
                message.role === 'assistant'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'
                  : 'bg-[#871F1E] text-white shadow-md rounded-tr-none'
              }`}
            >
              {(() => {
                const { cleanContent, sources } = message.role === 'assistant' 
                  ? parseSources(message.content) 
                  : { cleanContent: message.content, sources: [] };
                
                return (
                  <>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className={`mb-4 grid gap-3 ${message.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                        {message.attachments.map((attachment) => (
                          <button
                            key={attachment.id}
                            type="button"
                            onClick={() => {
                              if (attachment.dataUrl) {
                                onPreviewAttachment(attachment);
                              }
                            }}
                            className="overflow-hidden rounded-2xl"
                            aria-label={`Preview ${attachment.name}`}
                          >
                            {attachment.dataUrl ? (
                              <img
                                src={attachment.dataUrl}
                                alt={attachment.name}
                                className="max-h-72 w-full rounded-2xl border border-white/20 object-cover shadow-sm transition hover:scale-[1.01]"
                              />
                            ) : (
                              <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/10 px-4 text-center text-xs font-medium text-white/80">
                                {attachment.name}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    <MessageContent content={cleanContent} isAssistant={message.role === 'assistant'} />
                    {sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                        {sources.map((source: MessageSource, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleSourceClick(source.link)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-100 transition-all font-medium text-[11px]"
                          >
                            {source.link.startsWith('/') ? <Navigation size={12} /> : <ExternalLink size={12} />}
                            {source.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter px-1">
              {message.timestamp}
            </span>
          </div>
        </div>
      ))}

      {/* Perplexity-style Thinking Process (Standalone) */}
      {task && (task.status === 'running' || task.status === 'cancelled') && (
        <div className="flex flex-col gap-6 ml-14 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-3 text-slate-400">
            {task.status === 'running' ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <XCircle size={16} />
            )}
            <span className="text-sm font-medium tracking-tight">
              {task.status === 'running' ? 'Thinking...' : 'Generation stopped'}
            </span>
          </div>
          
          <div className="space-y-4 border-l-2 border-slate-100 pl-4 py-1">
            {task.steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 group transition-all">
                <div className={`flex-shrink-0 transition-all duration-500 ${
                  step.status === 'completed' ? 'scale-110' : ''
                }`}>
                  {step.status === 'completed' && (
                    <div className="bg-emerald-50 p-0.5 rounded-full">
                      <CheckCircle className="text-emerald-500" size={16} />
                    </div>
                  )}
                  {step.status === 'running' && (
                    <div className="bg-blue-50 p-0.5 rounded-full">
                      <Loader2 className="text-blue-500 animate-spin" size={16} />
                    </div>
                  )}
                  {step.status === 'pending' && (
                    <Circle className="text-slate-200" size={16} />
                  )}
                  {step.status === 'failed' && (
                    <XCircle className="text-red-500" size={16} />
                  )}
                </div>
                <span
                  className={`text-xs transition-colors duration-300 ${
                    step.status === 'completed'
                      ? 'text-slate-400'
                      : step.status === 'running'
                        ? 'text-slate-900 font-semibold'
                        : 'text-slate-300'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simple typing indicator (fallback when no task) */}
      {isTyping && (!task || task.status !== 'running') && (
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
  );
};
