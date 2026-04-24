import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDataStore, type Message, type ChatAttachment, type ChatSession } from "../store/useDataStore";
import { useMeasureData } from "./useMeasureData";
import { type AgentTask, type TaskStep } from "../types/agent";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

const BACKEND_URL = 'http://localhost:3001';

export const useChat = () => {
  const {
    chatSessions,
    activeChatSessionId,
    setChatSessions,
    setActiveChatSessionId,
    addMessageToSession,
    updateMessageInSession,
    updateChatSession,
    deleteChatSession,
    clearChatSessions,
  } = useDataStore();

  const measureData = useMeasureData();
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isBootstrappingSessions, setIsBootstrappingSessions] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingTaskIds = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const buildAttachmentPromptNote = useCallback((attachments: ChatAttachment[]) => {
    if (attachments.length === 0) {
      return "";
    }

    const attachmentList = attachments
      .map((attachment) => `${attachment.name} (${attachment.mimeType})`)
      .join(", ");

    return `\n\n[User attached ${attachments.length} image${attachments.length > 1 ? "s" : ""}: ${attachmentList}. Note: the current chat backend receives attachment metadata only and may not interpret image contents yet.]`;
  }, []);

  // Realtime subscription for task and step updates
  const activeTaskId = activeTask?.id;
  useEffect(() => {
    if (!activeTaskId || activeTask?.status === 'completed' || activeTask?.status === 'failed') return;

    let isMounted = true;

    // Helper to fetch the latest state once
    const refreshTaskState = async () => {
      if (!isMounted) return;
      
      const { data: steps } = await supabase
        .from('agent_steps')
        .select('*')
        .eq('task_id', activeTaskId)
        .order('order_index', { ascending: true });

      const { data: task } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('id', activeTaskId)
        .single();

      if (isMounted && task) {
        setActiveTask({
          ...task,
          steps: (steps || []) as TaskStep[]
        });

        // Handle task completion logic
        if (task.status === 'completed' || task.status === 'failed') {
          setIsTyping(false);
          
          const latestSessions = useDataStore.getState().chatSessions;
          const activeSession = latestSessions.find(s => s.id === task.session_id);
          const assistantMessages = activeSession?.messages.filter(m => m.role === 'assistant') || [];
          const lastAsstMsg = assistantMessages[assistantMessages.length - 1];
          
          const synthesisStep = steps?.find(s => s.action === 'synthesis' || s.tool_name === 'generate_response');
          const finalResult = synthesisStep?.result;
          const isTaskStreaming = streamingTaskIds.current.has(activeTaskId);
          
          const lastMsgContent = lastAsstMsg?.content.trim();
          const cleanFinalResult = finalResult?.trim();
          const isAlreadyAdded = lastMsgContent && cleanFinalResult && (
            lastMsgContent === cleanFinalResult || 
            lastMsgContent.includes(cleanFinalResult) || 
            cleanFinalResult.includes(lastMsgContent)
          );

          if (task.status === 'completed' && finalResult && task.session_id && !isTaskStreaming && !isAlreadyAdded) {
            const formattedMessage: Message = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
              role: "assistant",
              content: finalResult,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            addMessageToSession(task.session_id, formattedMessage);
          }
        }
      }
    };

    // Initialize with a fetch
    refreshTaskState();

    // Subscribe to changes on THIS specific task and its steps
    const taskChannel = supabase.channel(`task_${activeTaskId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'agent_tasks', 
        filter: `id=eq.${activeTaskId}` 
      }, refreshTaskState)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'agent_steps', 
        filter: `task_id=eq.${activeTaskId}` 
      }, refreshTaskState)
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(taskChannel);
    };
  }, [activeTaskId, activeTask?.status, addMessageToSession]);

  // Derive messages from active session
  const messages = useMemo(() => {
    const activeSession = chatSessions.find(
      (s) => s.id === activeChatSessionId
    );
    return activeSession ? activeSession.messages : [];
  }, [chatSessions, activeChatSessionId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const mergeRemoteSessions = useCallback(
    (prevSessions: ChatSession[], remoteSessions: Array<{
      id: string;
      title: string;
      last_updated: string;
      chat_messages?: Array<{
        id: string;
        role: 'user' | 'assistant';
        content: string;
        created_at: string;
      }>;
    }>) => {
      const mergedSessions = [...prevSessions];

      remoteSessions.forEach((remoteSession) => {
        const dbMessages: Message[] = (remoteSession.chat_messages ?? [])
          .slice()
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            attachments: [],
          }));

        const localIndex = mergedSessions.findIndex((localSession) => localSession.id === remoteSession.id);
        if (localIndex !== -1) {
          mergedSessions[localIndex] = {
            ...mergedSessions[localIndex],
            title: remoteSession.title,
            messages: dbMessages.length > 0 ? dbMessages : mergedSessions[localIndex].messages,
            lastUpdated: new Date(remoteSession.last_updated).getTime(),
          };
          return;
        }

        mergedSessions.push({
          id: remoteSession.id,
          title: remoteSession.title,
          messages: dbMessages,
          lastUpdated: new Date(remoteSession.last_updated).getTime(),
        });
      });

      return mergedSessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
    },
    []
  );

  // Supabase Realtime Subscription for remote deletions
  useEffect(() => {
    const channel = supabase
      .channel('chat_session_updates')
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_sessions' },
        (payload) => {
          const deletedId = payload.old.id;
          if (deletedId) {
            useDataStore.getState().removeChatSessionLocally(deletedId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initial sync from Supabase on mount
  useEffect(() => {
    let isMounted = true;

    const fetchRemoteSessions = async () => {
      try {
        const { data: remoteSessions, error } = await supabase
          .from('chat_sessions')
          .select('*, chat_messages(*)')
          .order('last_updated', { ascending: false });

        if (error) throw error;
        if (!isMounted || !remoteSessions) return;

        if (remoteSessions.length === 0) {
          setIsBootstrappingSessions(false);
          return;
        }

        setChatSessions((prevSessions: ChatSession[]) => mergeRemoteSessions(prevSessions, remoteSessions));
      } catch (err) {
        console.error('Failed to fetch remote sessions:', err);
        toast.error('Failed to fetch chat sessions.');
      } finally {
        if (isMounted) {
          setIsBootstrappingSessions(false);
        }
      }
    };

    void fetchRemoteSessions();

    return () => {
      isMounted = false;
    };
  }, [mergeRemoteSessions, setChatSessions]);

  // Initialize with a session if empty or select the first one
  useEffect(() => {
    if (isBootstrappingSessions) {
      return;
    }

    if (chatSessions.length === 0) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: "New Conversation",
        messages: [],
        lastUpdated: Date.now(),
      };
      
      // Persist empty session
      supabase.from('chat_sessions').upsert({
        id: newSession.id,
        title: newSession.title,
        last_updated: new Date(newSession.lastUpdated).toISOString()
      }, { onConflict: 'id' }).then(({ error }) => {
        if (error) {
          console.error(error);
          toast.error('Failed to initialize new chat session.');
        }
      });

      setChatSessions([newSession]);
      setActiveChatSessionId(newSession.id);
    } else if (!activeChatSessionId && chatSessions.length > 0) {
      setActiveChatSessionId(chatSessions[0].id);
    }
  }, [chatSessions, activeChatSessionId, isBootstrappingSessions, setChatSessions, setActiveChatSessionId]);

  // Helper to add a message to the current session
  const addMessage = useCallback(
    (msg: { role: "user" | "assistant"; content: string; attachments?: ChatAttachment[] }) => {
      if (!activeChatSessionId) return;
      const message: Message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments ?? [],
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      addMessageToSession(activeChatSessionId, message);
    },
    [activeChatSessionId, addMessageToSession]
  );

  const addPendingAttachments = useCallback((attachments: ChatAttachment[]) => {
    setPendingAttachments((current) => [...current, ...attachments]);
  }, []);

  const removePendingAttachment = useCallback((attachmentId: string) => {
    setPendingAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  }, []);

  const clearPendingAttachments = useCallback(() => {
    setPendingAttachments([]);
  }, []);

  const handleSendMessage = async (directPrompt?: string) => {
    const input = directPrompt || inputValue;
    const attachmentsToSend = directPrompt ? [] : pendingAttachments;
    if (!input.trim() && attachmentsToSend.length === 0) return;
    if (!activeChatSessionId) return;
    const userFacingContent = input.trim();
    const goalWithAttachmentNote = `${userFacingContent}${buildAttachmentPromptNote(attachmentsToSend)}`.trim();

    // 1. Add user message
    addMessage({ role: "user", content: userFacingContent, attachments: attachmentsToSend });

    // Update title if first message
    const activeSession = chatSessions.find(
      (s) => s.id === activeChatSessionId
    );
    if (activeSession && activeSession.title === "New Conversation") {
      updateChatSession(activeChatSessionId, {
        title: (userFacingContent || "Image attachment").substring(0, 30),
      });
    }

    // Extract recent chat history (last 5 messages before this input)
    let chatHistory: Array<{role: string, content: string}> = [];
    if (activeSession && activeSession.messages) {
      chatHistory = activeSession.messages.slice(-5).map(m => ({
        role: m.role,
        content: `${m.content}${buildAttachmentPromptNote(m.attachments ?? [])}`.trim()
      }));
    }

    setInputValue("");
    clearPendingAttachments();
    setIsTyping(true);

    try {
      // 1. Create a task in Supabase via backend (Planning Phase)
      const initRes = await fetch(`${BACKEND_URL}/api/agent/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          goal: goalWithAttachmentNote,
          sessionId: activeChatSessionId,
          chatHistory
        }),
      });
      if (!initRes.ok) {
        throw new Error(`Failed to create task: ${initRes.status}`);
      }
      const task = await initRes.json();
      setActiveTask(task);
      streamingTaskIds.current.add(task.id);

      // 3. Run agent on backend
      // Prepare context to send
      const context = {
        metrics: measureData ? `Current Revenue: $${measureData.kpi.revenue.toLocaleString()}, Spend: $${measureData.kpi.spend.toLocaleString()}` : "No metrics loaded",
      };

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const response = await fetch(`${BACKEND_URL}/api/agent/run-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, context, chatHistory }),
        signal: abortController.signal
      });
      if (!response.ok) {
        throw new Error(`Failed to start task stream: ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let assistantMessageId = '';
      let accumulatedContent = '';
      let isSynthesisStarted = false;
      let eventBuffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          eventBuffer += decoder.decode(value, { stream: true });
          const events = eventBuffer.split('\n\n');
          eventBuffer = events.pop() ?? '';

          for (const event of events) {
            const payload = event
              .split('\n')
              .filter((line) => line.startsWith('data: '))
              .map((line) => line.substring(6))
              .join('\n');

            if (!payload) {
              continue;
            }

            try {
              const data = JSON.parse(payload);
              
              if (data.chunk) {
                if (data.chunk === 'SSE_RESERVED_START_SYNTHESIS') {
                  isSynthesisStarted = true;
                  // Create the assistant message placeholder
                  assistantMessageId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
                  addMessageToSession(activeChatSessionId, {
                    id: assistantMessageId,
                    role: "assistant",
                    content: "",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  });
                  continue;
                }

                if (isSynthesisStarted) {
                  accumulatedContent += data.chunk;
                  // Update UI immediately without typing animation
                  updateMessageInSession(activeChatSessionId, assistantMessageId, accumulatedContent);
                }
              }

              if (data.error) {
                console.error('Agent stream error:', data.error);
                toast.error('Error during chat generation stream.');
              }
            } catch {
              // Ignore malformed or partial SSE payloads
            }
          }
        }
      } finally {
        readerRef.current = null;
        abortControllerRef.current = null;
        setIsTyping(false);
        if (task.id) {
          streamingTaskIds.current.delete(task.id);
          
          // --- ROBUSTNESS: Manual final fetch of task state ---
          // This ensures the "Thinking..." state is dismissed even if Realtime misses the event.
          try {
            const { data: finalSteps } = await supabase.from('agent_steps').select('*').eq('task_id', task.id).order('order_index', { ascending: true });
            const { data: finalTask } = await supabase.from('agent_tasks').select('*').eq('id', task.id).single();
            if (finalTask) {
              setActiveTask({ ...finalTask, steps: (finalSteps || []) as TaskStep[] });
            }
          } catch (err) {
            console.error('Failed to perform final task sync:', err);
            toast.error('Failed to synchronize final chat task.');
          }
        }
      }

    } catch (err) {
      console.error('Failed to communicate with agent backend:', err);
      toast.error('Failed to communicate with backend.');
      addMessage({ 
        role: "assistant", 
        content: "I'm sorry, I'm having trouble connecting to my brain right now. Please ensure the local backend server is running." 
      });
      setIsTyping(false);
    }
  };

  const handleDeleteHistory = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      deleteChatSession(sessionId);
    }
  };

  const handleDeleteCurrentChat = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this current chat session?"
      )
    ) {
      if (activeChatSessionId) {
        deleteChatSession(activeChatSessionId);
      }
    }
  };

  const handleClearAll = async () => {
    if (chatSessions.length === 0) return;
    
    if (
      window.confirm(
        "Are you sure you want to delete ALL conversations? This action cannot be undone."
      )
    ) {
      try {
        // Delete all from Supabase
        const { error } = await supabase.from('chat_sessions').delete().neq('id', '0');
        if (error) throw error;

        // Clear local state
        clearChatSessions();
        
        // Initialize with a fresh session
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: "New Conversation",
          messages: [],
          lastUpdated: Date.now(),
        };
        
        // Persist empty session
        await supabase.from('chat_sessions').upsert({
          id: newSession.id,
          title: newSession.title,
          last_updated: new Date(newSession.lastUpdated).toISOString()
        }, { onConflict: 'id' });

        setChatSessions([newSession]);
        setActiveChatSessionId(newSession.id);
      } catch (err) {
        console.error('Failed to clear all conversations:', err);
        toast.error('Failed to clear all conversations. Please try again.');
      }
    }
  };

  const handleStopGenerating = useCallback(async () => {
    if (!activeTaskId) return;

    try {
      // 1. Signal cancellation to the backend via Supabase
      await supabase
        .from('agent_tasks')
        .update({ status: 'cancelled' })
        .eq('id', activeTaskId);

      // 2. Abort the fetch request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // 3. Cancel the stream reader
      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch {
          // ignore reader cancellation errors
        }
        readerRef.current = null;
      }

      setIsTyping(false);
      
      // Update local task state immediately for UI feedback
      setActiveTask(prev => prev ? { ...prev, status: 'cancelled' } : null);
      
    } catch (err) {
      console.error('Failed to stop generating:', err);
      toast.error('Failed to cancel generation.');
    }
  }, [activeTaskId]);

  const handleNewChat = () => {
    if (messages.length === 0) return;
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      lastUpdated: Date.now(),
    };
    
    // Persist empty session
    supabase.from('chat_sessions').upsert({
      id: newSession.id,
      title: newSession.title,
      last_updated: new Date(newSession.lastUpdated).toISOString()
    }, { onConflict: 'id' }).then(({ error }) => {
      if (error) {
        console.error(error);
        toast.error('Failed to create new chat session.');
      }
    });

    setChatSessions((prevSessions) => [newSession, ...prevSessions]);
    setActiveChatSessionId(newSession.id);
  };

  return {
    sessions: chatSessions,
    activeSessionId: activeChatSessionId,
    setActiveSessionId: setActiveChatSessionId,
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
    handleStopGenerating,
    handleDeleteHistory,
    handleDeleteCurrentChat,
    handleClearAll,
    handleNewChat,
  };
};
