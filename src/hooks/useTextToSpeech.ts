import { useState, useEffect, useCallback } from 'react';

export interface TTSOptions {
  /** Voice identifier for Google Cloud TTS (e.g., 'es-US-Studio-B') */
  voiceId?: string;
  /** Speaking speed, 0.5 (slow) – 2.0 (fast) */
  speed?: number;
  /** Whether to use the premium Google Cloud TTS. If false, uses native SpeechSynthesis. */
  useGoogleTTS?: boolean;
  /** Called when audio playback starts */
  onStart?: () => void;
  /** Called when audio playback ends */
  onEnd?: () => void;
  /** Called when an error occurs during synthesis or playback */
  onError?: (error: unknown) => void;
}

/**
 * Hook that synthesizes text to speech.
 *
 * It automatically decides between Google Cloud TTS (requires env var `NEXT_PUBLIC_DEFAULT_VOICE_ID`
 * and `GOOGLE_TTS_API_KEY`) and the browser's SpeechSynthesis API.
 */
export function useTextToSpeech(options: TTSOptions = {}) {
  const {
    voiceId = process.env.NEXT_PUBLIC_DEFAULT_VOICE_ID || 'es-US-Studio-B',
    speed = parseFloat(process.env.NEXT_PUBLIC_VOICE_SPEED ?? '1.05'),
    useGoogleTTS = !!process.env.NEXT_PUBLIC_DEFAULT_VOICE_ID && !!process.env.NEXT_PUBLIC_GOOGLE_TTS_API_KEY,
    onStart,
    onEnd,
    onError,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const speak = useCallback(
    async (text: string) => {
      try {
        setIsSpeaking(true);
        onStart?.();
        if (useGoogleTTS) {
          // Call our API endpoint that proxies Google Cloud TTS
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice: voiceId, speed }),
          });
          if (!response.ok) throw new Error('TTS request failed');
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        } else {
          // Fallback using native SpeechSynthesis
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = 'es-ES';
          utter.rate = speed;
          const matching = speechSynthesis.getVoices().find(v => v.name.includes(voiceId));
          if (matching) utter.voice = matching;
          speechSynthesis.speak(utter);
          await new Promise<void>((resolve, reject) => {
            utter.onend = () => resolve();
            utter.onerror = e => reject(e);
          });
          setIsSpeaking(false);
          onEnd?.();
          return;
        }
      } catch (e) {
        onError?.(e);
        setIsSpeaking(false);
        throw e;
      }
    },
    [voiceId, speed, useGoogleTTS, onStart, onEnd, onError]
  );

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return { speak, isSpeaking, audioUrl, setIsSpeaking };
}
