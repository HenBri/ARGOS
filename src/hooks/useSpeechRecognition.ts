'use client';
import { useEffect, useRef, useState } from 'react';
import '@/types/speech-recognition.d';

export interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  error: string | null;
  isSupported: boolean;
}

export function useSpeechRecognition(options?: {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (text: string) => void;
  onSilence?: () => void;
}) {
  const isSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    confidence: 0,
    error: null,
    isSupported,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = options?.lang ?? 'es-BO';
    recognition.continuous = options?.continuous ?? false;
    recognition.interimResults = options?.interimResults ?? true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState((prev) => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onerror = (ev: SpeechRecognitionErrorEvent) => {
      setState((prev) => ({ ...prev, error: ev.error }));
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false }));
      options?.onSilence?.();
    };

    recognition.onresult = (ev: SpeechRecognitionEvent) => {
      let interim = '';
      let finalText = '';
      for (let i = ev.resultIndex; i < ev.results.length; ++i) {
        const result = ev.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalText += text;
          setState((prev) => ({ ...prev, confidence: result[0].confidence }));
          options?.onResult?.(text);
        } else {
          interim += text;
        }
      }
      setState((prev) => ({
        ...prev,
        transcript: finalText ? prev.transcript + finalText : prev.transcript,
        interimTranscript: interim,
      }));
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  const startListening = () => {
    if (recognitionRef.current && !state.isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  };

  const reset = () => {
    setState((prev) => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      confidence: 0,
      error: null,
    }));
  };

  return { state, startListening, stopListening, reset } as const;
}
