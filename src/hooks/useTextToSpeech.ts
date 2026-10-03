import { useState, useEffect, useCallback } from 'react';

export interface TTSOptions {
  /** Voice identifier for ElevenLabs (e.g., 't3eeeqhBjrUqcrPvDqUn') */
  voiceId?: string;
  /** Speaking speed, 0.5 (slow) – 2.0 (fast) */
  speed?: number;
  /** Called when audio playback starts */
  onStart?: () => void;
  /** Called when audio playback ends */
  onEnd?: () => void;
  /** Called when an error occurs during synthesis or playback */
  onError?: (error: unknown) => void;
}

/**
 * Hook that synthesizes text to speech via ElevenLabs (/api/tts).
 *
 * Falls back to the browser's native SpeechSynthesis API when the
 * server signals that the ElevenLabs key is missing or invalid.
 */
export function useTextToSpeech(options: TTSOptions = {}) {
  const {
    voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 't3eeeqhBjrUqcrPvDqUn',
    speed = parseFloat(process.env.NEXT_PUBLIC_VOICE_SPEED ?? '1.05'),
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

        // Call our ElevenLabs TTS endpoint
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: voiceId }),
        });

        // Check if the API returned a JSON fallback signal
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data?.fallback) {
            // Fallback: use native SpeechSynthesis
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = 'es-ES';
            utter.rate = speed;
            speechSynthesis.speak(utter);
            await new Promise<void>((resolve, reject) => {
              utter.onend = () => resolve();
              utter.onerror = e => reject(e);
            });
            setIsSpeaking(false);
            onEnd?.();
            return;
          }
        }

        // ElevenLabs returned MP3 audio
        if (contentType.includes('audio')) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);

          const audio = new Audio(url);
          audio.onended = () => {
            URL.revokeObjectURL(url);
            setIsSpeaking(false);
            onEnd?.();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            setIsSpeaking(false);
            onError?.('Audio playback error');
          };
          await audio.play();
          return;
        }

        // Unexpected response — fall back silently
        setIsSpeaking(false);
        onEnd?.();
      } catch (e) {
        onError?.(e);
        setIsSpeaking(false);
        throw e;
      }
    },
    [voiceId, speed, onStart, onEnd, onError]
  );

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return { speak, isSpeaking, audioUrl, setIsSpeaking };
}
