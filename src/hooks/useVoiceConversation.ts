'use client';
import { useState, useCallback, useRef } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useTextToSpeech } from './useTextToSpeech';
import { VoiceConversationState, VoicePreferences, DEFAULT_VOICE_PREFERENCES } from '@/types/voice';

interface UseVoiceConversationOptions {
  sessionId: string | null;
  onMessageSent?: (text: string) => void;
  onResponseReceived?: (text: string) => void;
  autoReactivate?: boolean;
  interruptible?: boolean;
}

/**
 * Orchestrates the full STT → API → TTS → STT cycle.
 * - Listens to the user via Web Speech API (STT)
 * - Sends the transcript to /api/chat
 * - Reads the response aloud via /api/tts (Google Cloud TTS or SpeechSynthesis)
 * - Optionally re-activates the microphone after the response (continuous mode)
 */
export function useVoiceConversation({
  sessionId,
  onMessageSent,
  onResponseReceived,
  autoReactivate = true,
  interruptible = true,
}: UseVoiceConversationOptions) {
  const [voiceState, setVoiceState] = useState<VoiceConversationState>({
    phase: 'idle',
    isVoiceMode: false,
    isListening: false,
    isSpeaking: false,
    currentTranscript: '',
    turnCount: 0,
    error: null,
  });

  const [preferences, setPreferences] = useState<VoicePreferences>(DEFAULT_VOICE_PREFERENCES);
  const isVoiceModeRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── TTS ──────────────────────────────────────────────────────────────────
  const { isSpeaking, setIsSpeaking } = useTextToSpeech({
    voiceId: preferences.voiceId,
    speed: preferences.speed,
    onStart: () => setVoiceState((s) => ({ ...s, isSpeaking: true, phase: 'speaking' })),
    onEnd: () => {
      setVoiceState((s) => ({ ...s, isSpeaking: false }));
      // Re-activate microphone in continuous mode
      if (isVoiceModeRef.current && autoReactivate && preferences.autoListen) {
        setTimeout(() => {
          if (isVoiceModeRef.current) startListening();
        }, 400);
      }
    },
    onError: (e) => {
      console.error('[VoiceConversation TTS error]', e);
      setVoiceState((s) => ({ ...s, isSpeaking: false, phase: 'idle' }));
    },
  });

  // ── Speak helper ─────────────────────────────────────────────────────────
  const speakText = useCallback(
    async (text: string) => {
      setVoiceState((s) => ({ ...s, isSpeaking: true, phase: 'speaking' }));
      try {
        // Try Google Cloud TTS via /api/tts
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: preferences.voiceId, speed: preferences.speed }),
        });

        const data = await res.json().catch(() => null);

        if (data?.fallback) {
          // Fallback: use native SpeechSynthesis
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = 'es-ES';
          utter.rate = preferences.speed;
          utter.volume = preferences.volume;
          utter.onend = () => {
            setVoiceState((s) => ({ ...s, isSpeaking: false }));
            if (isVoiceModeRef.current && autoReactivate && preferences.autoListen) {
              setTimeout(() => { if (isVoiceModeRef.current) startListening(); }, 400);
            }
          };
          speechSynthesis.speak(utter);
          return;
        }

        // Google Cloud TTS returned MP3
        if (res.headers.get('content-type')?.includes('audio')) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.volume = preferences.volume;
          audioRef.current = audio;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            setVoiceState((s) => ({ ...s, isSpeaking: false }));
            if (isVoiceModeRef.current && autoReactivate && preferences.autoListen) {
              setTimeout(() => { if (isVoiceModeRef.current) startListening(); }, 400);
            }
          };
          await audio.play();
        }
      } catch (e) {
        console.error('[speakText error]', e);
        setVoiceState((s) => ({ ...s, isSpeaking: false, phase: 'idle' }));
      }
    },
    [preferences, autoReactivate]
  );

  // ── STT callbacks ─────────────────────────────────────────────────────────
  const handleSpeechResult = useCallback(
    async (transcript: string) => {
      if (!transcript.trim()) return;

      setVoiceState((s) => ({
        ...s,
        phase: 'processing',
        currentTranscript: transcript,
        isListening: false,
      }));

      onMessageSent?.(transcript);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: transcript,
            sessionId,
            voiceMode: true,
          }),
        });

        if (!response.ok) throw new Error('Chat API error');
        const data = await response.json();
        const replyText: string = data.record?.respuesta_ia || '';

        setVoiceState((s) => ({ ...s, turnCount: s.turnCount + 1 }));
        onResponseReceived?.(replyText);

        if (preferences.readAloud && replyText) {
          await speakText(replyText);
        } else {
          setVoiceState((s) => ({ ...s, phase: 'idle' }));
          if (isVoiceModeRef.current && autoReactivate && preferences.autoListen) {
            setTimeout(() => { if (isVoiceModeRef.current) startListening(); }, 400);
          }
        }
      } catch (e) {
        console.error('[VoiceConversation] Chat error:', e);
        setVoiceState((s) => ({ ...s, phase: 'error', error: 'Error al conectar con Jarvis' }));
      }
    },
    [sessionId, speakText, preferences, autoReactivate, onMessageSent, onResponseReceived]
  );

  const handleSilence = useCallback(() => {
    // STT ended — if we got a transcript, handleSpeechResult was already called
    setVoiceState((s) => ({ ...s, isListening: false }));
  }, []);

  const { startListening: sttStart, stopListening: sttStop, reset: sttReset } = useSpeechRecognition({
    lang: 'es-BO',
    continuous: false,
    interimResults: true,
    onResult: handleSpeechResult,
    onSilence: handleSilence,
  });

  const startListening = useCallback(() => {
    setVoiceState((s) => ({ ...s, isListening: true, phase: 'listening', currentTranscript: '' }));
    sttStart();
  }, [sttStart]);

  // ── Public controls ───────────────────────────────────────────────────────
  const startVoiceMode = useCallback(() => {
    isVoiceModeRef.current = true;
    setVoiceState((s) => ({ ...s, isVoiceMode: true, turnCount: 0, error: null }));
    startListening();
  }, [startListening]);

  const stopVoiceMode = useCallback(() => {
    isVoiceModeRef.current = false;
    sttStop();
    speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setVoiceState({
      phase: 'idle',
      isVoiceMode: false,
      isListening: false,
      isSpeaking: false,
      currentTranscript: '',
      turnCount: 0,
      error: null,
    });
  }, [sttStop]);

  const skipCurrentSpeech = useCallback(() => {
    speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setVoiceState((s) => ({ ...s, isSpeaking: false }));
    if (isVoiceModeRef.current && autoReactivate && preferences.autoListen) {
      setTimeout(() => { if (isVoiceModeRef.current) startListening(); }, 300);
    }
  }, [autoReactivate, preferences.autoListen, startListening]);

  const updatePreferences = useCallback((prefs: Partial<VoicePreferences>) => {
    setPreferences((prev) => ({ ...prev, ...prefs }));
  }, []);

  return {
    voiceState,
    startVoiceMode,
    stopVoiceMode,
    skipCurrentSpeech,
    voicePreferences: preferences,
    setVoicePreferences: updatePreferences,
  } as const;
}
