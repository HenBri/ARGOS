'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { VoiceConversationPhase } from '@/types/voice';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  // Nuevos props de voz
  voicePhase?: VoiceConversationPhase;
  isVoiceMode?: boolean;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  onVoiceSkip?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
  voicePhase = 'idle',
  isVoiceMode = false,
  onVoiceStart,
  onVoiceStop,
  onVoiceSkip,
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !disabled && !isVoiceMode) {
      inputRef.current?.focus();
    }
  }, [isLoading, disabled, isVoiceMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled || isVoiceMode) return;

    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="p-3 bg-white border-t border-slate-100 rounded-b-2xl flex items-center gap-2">
      {onVoiceStart && onVoiceStop && (
        <div className="flex-shrink-0">
          <VoiceButton
            phase={voicePhase}
            isVoiceMode={isVoiceMode}
            onStart={onVoiceStart}
            onStop={onVoiceStop}
            onSkip={onVoiceSkip}
            disabled={disabled && !isVoiceMode}
          />
        </div>
      )}
      <form onSubmit={handleSubmit} className="relative flex-1 flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isVoiceMode
              ? (voicePhase === 'listening' ? 'Te escucho...' : (voicePhase === 'processing' ? 'Procesando voz...' : (voicePhase === 'speaking' ? 'Jarvis está hablando...' : 'Modo voz activo')))
              : isLoading
              ? 'El asistente está escribiendo...'
              : 'Escribe tu consulta...'
          }
          disabled={isLoading || disabled || isVoiceMode}
          className="w-full pl-3.5 pr-12 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all text-slate-800 placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading || disabled || isVoiceMode}
          aria-label="Enviar mensaje"
          className="absolute right-1.5 p-2 text-white bg-sky-600 rounded-lg hover:bg-sky-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};

