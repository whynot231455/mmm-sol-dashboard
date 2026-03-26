import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface BrowserSpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface UseSpeechToTextOptions {
  value: string;
  onChange: (value: string) => void;
  lang?: string;
}

const getSpeechRecognitionConstructor = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as BrowserSpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
};

export const useSpeechToText = ({
  value,
  onChange,
  lang = "en-US",
}: UseSpeechToTextOptions) => {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldContinueRef = useRef(false);
  const sessionBaseValueRef = useRef("");
  const finalizedTranscriptRef = useRef("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionConstructor = useMemo(() => getSpeechRecognitionConstructor(), []);
  const isSupported = recognitionConstructor !== null;

  const buildMergedValue = useCallback((spokenText: string) => {
    const trimmedSpoken = spokenText.trim();
    if (!trimmedSpoken) {
      return sessionBaseValueRef.current;
    }

    const baseValue = sessionBaseValueRef.current.trimEnd();
    if (!baseValue) {
      return trimmedSpoken;
    }

    const separator = /\s$/.test(sessionBaseValueRef.current) ? "" : " ";
    return `${baseValue}${separator}${trimmedSpoken}`;
  }, []);

  const stopListening = useCallback(() => {
    shouldContinueRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionConstructor) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    setError(null);
    sessionBaseValueRef.current = value;
    finalizedTranscriptRef.current = "";
    shouldContinueRef.current = true;

    if (!recognitionRef.current) {
      const recognition = new recognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onresult = (event) => {
        let finalizedChunk = "";
        let interimChunk = "";

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result[0]?.transcript ?? "";

          if (result.isFinal) {
            finalizedChunk += transcript;
          } else {
            interimChunk += transcript;
          }
        }

        if (finalizedChunk) {
          finalizedTranscriptRef.current = `${finalizedTranscriptRef.current} ${finalizedChunk}`.trim();
        }

        onChange(buildMergedValue(`${finalizedTranscriptRef.current} ${interimChunk}`));
      };

      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setError("Microphone access was denied. Please allow microphone access to use voice input.");
          shouldContinueRef.current = false;
          setIsListening(false);
          return;
        }

        if (event.error === "aborted") {
          return;
        }

        setError("Speech recognition ran into an issue. Try starting the microphone again.");
      };

      recognition.onend = () => {
        if (!shouldContinueRef.current) {
          setIsListening(false);
          return;
        }

        try {
          recognition.start();
          setIsListening(true);
        } catch {
          setIsListening(false);
          shouldContinueRef.current = false;
          setError("Speech recognition could not restart. Try starting the microphone again.");
        }
      };

      recognitionRef.current = recognition;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      shouldContinueRef.current = false;
      setIsListening(false);
      setError("Speech recognition is already starting. Please try again in a moment.");
    }
  }, [buildMergedValue, lang, onChange, recognitionConstructor, value]);

  useEffect(() => {
    return () => {
      shouldContinueRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  return {
    error,
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
};
