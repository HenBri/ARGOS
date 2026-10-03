'use client';
import { VoiceConversationPhase } from '@/types/voice';
import { AudioWaveform } from './AudioWaveform';

interface VoiceButtonProps {
  phase: VoiceConversationPhase;
  isVoiceMode: boolean;
  onStart: () => void;
  onStop: () => void;
  onSkip?: () => void;
  disabled?: boolean;
}

const PHASE_CONFIG: Record<VoiceConversationPhase, { label: string; bg: string; pulse: boolean }> = {
  idle:       { label: '🎙️',  bg: '#374151', pulse: false },
  listening:  { label: '🔴',  bg: '#dc2626', pulse: true  },
  processing: { label: '⏳',  bg: '#7c3aed', pulse: false },
  speaking:   { label: '🔊',  bg: '#2563eb', pulse: false },
  paused:     { label: '⏸️',  bg: '#4b5563', pulse: false },
  error:      { label: '⚠️',  bg: '#ea580c', pulse: false },
};

/**
 * Voice Button with 5 visual states: idle / listening / processing / speaking / error.
 * Shows an animated waveform when listening or speaking.
 */
export function VoiceButton({
  phase,
  isVoiceMode,
  onStart,
  onStop,
  onSkip,
  disabled,
}: VoiceButtonProps) {
  const cfg = PHASE_CONFIG[phase] ?? PHASE_CONFIG.idle;
  const showWaveform = phase === 'listening' || phase === 'speaking';

  const handleClick = () => {
    if (disabled) return;
    if (isVoiceMode) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      {showWaveform && <AudioWaveform phase={phase} barCount={16} />}

      <button
        onClick={handleClick}
        disabled={disabled}
        title={isVoiceMode ? 'Detener modo voz' : 'Activar modo voz'}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: cfg.bg,
          fontSize: '20px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: cfg.pulse ? `0 0 0 4px ${cfg.bg}44` : 'none',
          animation: cfg.pulse ? 'pulse-ring 1.2s ease-out infinite' : 'none',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {cfg.label}
      </button>

      {phase === 'speaking' && onSkip && (
        <button
          onClick={onSkip}
          title="Saltar respuesta"
          style={{
            fontSize: '11px',
            color: '#9ca3af',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        >
          ⏭ saltar
        </button>
      )}

      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 ${PHASE_CONFIG.listening.bg}66; }
          70%  { box-shadow: 0 0 0 10px ${PHASE_CONFIG.listening.bg}00; }
          100% { box-shadow: 0 0 0 0 ${PHASE_CONFIG.listening.bg}00; }
        }
      `}</style>
    </div>
  );
}
