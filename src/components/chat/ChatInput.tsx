import React, { useEffect, useRef } from "react";
import { ImagePlus, Mic, Send, Square, X } from "lucide-react";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import type { ChatAttachment } from "../../store/useDataStore";

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  attachments: ChatAttachment[];
  onAddAttachments: (attachments: ChatAttachment[]) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onPreviewAttachment: (attachment: ChatAttachment) => void;
  onSend: () => void;
  onStop?: () => void;
  disabled?: boolean;
}

const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg"]);

const sanitizeBaseName = (name: string) =>
  name
    .replace(/\.[^/.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";

const buildAttachmentName = (file: File, index: number) => {
  const extension = file.type === "image/png" ? "png" : "jpg";
  const originalBase = sanitizeBaseName(file.name || "");
  const hasMeaningfulOriginalName = originalBase !== "image";
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  const label = hasMeaningfulOriginalName ? originalBase : "chat-image";

  return `${label}-${stamp}-${String(index + 1).padStart(2, "0")}.${extension}`;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

export const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  setInputValue,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  onPreviewAttachment,
  onSend,
  onStop,
  disabled,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    error: speechError,
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechToText({
    value: inputValue,
    onChange: setInputValue,
  });

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [inputValue]);

  const importFiles = async (files: File[]) => {
    const supportedFiles = files.filter((file) => ACCEPTED_IMAGE_TYPES.has(file.type));
    if (supportedFiles.length === 0) {
      return;
    }

    const nextAttachments = await Promise.all(
      supportedFiles.map(async (file, index) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: buildAttachmentName(file, index),
        type: "image" as const,
        mimeType: file.type as ChatAttachment["mimeType"],
        dataUrl: await readFileAsDataUrl(file),
      })),
    );

    onAddAttachments(nextAttachments);
  };

  return (
    <div className="px-8 pt-6 pb-4 bg-white border-t border-slate-50">
      <div className={`max-w-4xl mx-auto rounded-2xl border bg-slate-50 p-2 transition-all ${isListening ? "border-rose-300 ring-4 ring-rose-100" : "border-slate-200 focus-within:ring-4 focus-within:ring-brand-primary/5 focus-within:border-brand-primary/20"} ${disabled ? 'opacity-70' : ''}`}>
        {attachments.length > 0 ? (
          <div className="flex flex-wrap gap-3 px-2 pb-3 pt-1">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="relative h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (attachment.dataUrl) {
                      onPreviewAttachment(attachment);
                    }
                  }}
                  className="h-full w-full"
                  aria-label={`Preview ${attachment.name}`}
                >
                  {attachment.dataUrl ? (
                    <img src={attachment.dataUrl} alt={attachment.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 px-2 text-center text-[11px] font-medium text-slate-500">
                      {attachment.name}
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(attachment.id)}
                  className="absolute right-1 top-1 rounded-full bg-slate-900/80 p-1 text-white transition hover:bg-slate-900"
                  aria-label={`Remove ${attachment.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPaste={(e) => {
            const clipboardFiles = Array.from(e.clipboardData.items)
              .filter((item) => item.kind === "file")
              .map((item) => item.getAsFile())
              .filter((file): file is File => file !== null && ACCEPTED_IMAGE_TYPES.has(file.type));

            if (clipboardFiles.length > 0) {
              e.preventDefault();
              void importFiles(clipboardFiles);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !disabled) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={disabled ? "Agent is thinking..." : "Ask anything about your marketing performance..."}
          className="max-h-[220px] min-h-[52px] flex-1 resize-none overflow-y-auto bg-transparent px-4 py-3 text-sm leading-6 focus:outline-none text-slate-800"
          autoFocus
          disabled={disabled}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            void importFiles(files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Upload image"
          title="Upload PNG or JPEG"
          className="p-3 rounded-xl border bg-white text-slate-500 border-slate-200 transition-all hover:border-brand-primary/30 hover:text-brand-primary"
        >
          <ImagePlus size={18} />
        </button>
        {isSupported ? (
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={disabled}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            title={isListening ? "Stop voice input" : "Start voice input"}
            className={`p-3 rounded-xl border transition-all ${
              isListening
                ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200 hover:bg-rose-700"
                : "bg-white text-slate-500 border-slate-200 hover:border-brand-primary/30 hover:text-brand-primary"
            }`}
          >
            {isListening ? <Square size={18} /> : <Mic size={18} />}
          </button>
        ) : null}
        {disabled && onStop ? (
          <button 
            onClick={onStop}
            className="p-3 rounded-xl transition-all bg-rose-600 text-white shadow-lg shadow-rose-200 hover:bg-rose-700 hover:-translate-y-0.5"
            aria-label="Stop generating"
            title="Stop generating"
          >
            <Square size={20} fill="currentColor" />
          </button>
        ) : (
          <button 
            onClick={onSend}
            disabled={(!inputValue.trim() && attachments.length === 0) || disabled}
            className={`p-3 rounded-xl transition-all ${
              (inputValue.trim() || attachments.length > 0) && !disabled
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:-translate-y-0.5' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        )}
        </div>
      </div>
      <div className="max-w-4xl mx-auto mt-2 min-h-5 px-1 text-xs">
        {speechError ? (
          <p className="text-rose-600">{speechError}</p>
        ) : attachments.length > 0 ? (
          <p className="text-slate-500">PNG, JPEG, and pasted screenshots are attached and will appear in the chat when you send.</p>
        ) : isListening ? (
          <p className="text-rose-600 font-medium">Listening... tap the stop button when you're done speaking.</p>
        ) : isSupported ? (
          <p className="text-slate-500">Use the mic to dictate, upload PNG/JPEG images, or paste a screenshot directly into the composer.</p>
        ) : (
          <p className="text-slate-500">Voice input is available in supported browsers with microphone access, and image upload supports PNG, JPEG, and pasted screenshots.</p>
        )}
      </div>
    </div>
  );
};
