'use client';
import { useEffect, useRef } from 'react';
import { VoiceConversationPhase } from '@/types/voice';

interface AudioWaveformProps {
  phase: VoiceConversationPhase;
  barCount?: number;
}

/**
 * Animated waveform that reacts to the current voice phase.
 * - listening: fast random bars (microphone input simulation)
 * - speaking: smooth wave (TTS output)
 * - processing: slow pulse
 * - idle/error: flat line
 */
export function AudioWaveform({ phase, barCount = 24 }: AudioWaveformProps) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const bars = barsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!bars.length) return;

    let frame = 0;
    const animate = () => {
      frame++;
      bars.forEach((bar, i) => {
        let height = 4;
        if (phase === 'listening') {
          // Fast random noise
          height = 8 + Math.abs(Math.sin(frame * 0.18 + i * 0.6)) * 28 + Math.random() * 14;
        } else if (phase === 'speaking') {
          // Smooth sine wave
          height = 8 + Math.abs(Math.sin(frame * 0.08 + i * 0.45)) * 30;
        } else if (phase === 'processing') {
          // Slow pulse
          height = 6 + Math.abs(Math.sin(frame * 0.04 + i * 0.3)) * 16;
        }
        bar.style.height = `${height}px`;
      });
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  const getBarColor = () => {
    switch (phase) {
      case 'listening': return '#ef4444'; // red-500
      case 'speaking':  return '#3b82f6'; // blue-500
      case 'processing': return '#a855f7'; // purple-500
      default: return '#6b7280';           // gray-500
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        height: '48px',
        padding: '0 8px',
      }}
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          style={{
            width: '3px',
            height: '4px',
            borderRadius: '2px',
            backgroundColor: getBarColor(),
            transition: phase === 'idle' ? 'height 0.4s ease' : 'none',
            opacity: phase === 'idle' ? 0.3 : 0.85,
          }}
        />
      ))}
    </div>
  );
}
