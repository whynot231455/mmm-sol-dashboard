import React, { useState } from "react";
import { X } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { ChatHeader } from "../components/chat/ChatHeader";
import { ChatWelcome } from "../components/chat/ChatWelcome";
import { ChatMessageList } from "../components/chat/ChatMessageList";
import { ChatInput } from "../components/chat/ChatInput";
import type { ChatAttachment } from "../store/useDataStore";

export const ChatPage: React.FC = () => {
    const [previewAttachment, setPreviewAttachment] = useState<ChatAttachment | null>(null);
    const {
        sessions,
        activeSessionId,
        setActiveSessionId,
        activeTask,
        searchQuery,
        setSearchQuery,
        messages,
        inputValue,
        setInputValue,
        pendingAttachments,
        addPendingAttachments,
        removePendingAttachment,
        isTyping,
        messagesEndRef,
        handleSendMessage,
        handleDeleteHistory,
        handleDeleteCurrentChat,
        handleClearAll,
        handleNewChat,
        handleStopGenerating,
    } = useChat();

  return (
    <div className="flex h-full bg-white overflow-hidden min-h-0 selection:bg-[#450a0a]/10">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onDeleteHistory={handleDeleteHistory}
        onNewChat={handleNewChat}
        onClearAll={handleClearAll}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-[#fcf9f8] relative min-h-0">
        <ChatHeader onDeleteCurrentChat={handleDeleteCurrentChat} />

        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
          {messages.length === 0 ? (
            <ChatWelcome onSelectPrompt={(prompt) => {
              handleSendMessage(prompt);
            }} />
          ) : (
            <ChatMessageList
              messages={messages}
              task={activeTask}
              isTyping={isTyping}
              messagesEndRef={messagesEndRef}
              onPreviewAttachment={setPreviewAttachment}
            />
          )}
        </div>

        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          attachments={pendingAttachments}
          onAddAttachments={addPendingAttachments}
          onRemoveAttachment={removePendingAttachment}
          onPreviewAttachment={setPreviewAttachment}
          onSend={handleSendMessage}
          onStop={handleStopGenerating}
          disabled={isTyping}
        />
      </div>

      {previewAttachment ? (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Expanded preview for ${previewAttachment.name}`}
          onClick={() => setPreviewAttachment(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewAttachment(null)}
            className="absolute right-6 top-6 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
            aria-label="Close image preview"
          >
            <X size={20} />
          </button>
          <div
            className="flex max-h-full max-w-6xl flex-col items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            {previewAttachment.dataUrl ? (
              <img
                src={previewAttachment.dataUrl}
                alt={previewAttachment.name}
                className="max-h-[80vh] max-w-full rounded-3xl object-contain shadow-2xl"
              />
            ) : (
              <div className="flex min-h-64 w-full max-w-2xl items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 text-center text-sm font-medium text-white/80">
                Preview unavailable after reload. The attachment metadata is still in the chat, but the image blob is no longer persisted.
              </div>
            )}
            <p className="text-sm font-medium text-white/90">{previewAttachment.name}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
