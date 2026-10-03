'use client';

import React from 'react';
import { Bot, X, RotateCcw, Sparkles } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
  onReset: () => void;
  isConnected: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClose,
  onReset,
  isConnected,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 text-white rounded-t-2xl shadow-sm select-none">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/25 shadow-inner">
          <Bot className="w-5 h-5 text-amber-100" />
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
              isConnected ? 'bg-emerald-400' : 'bg-amber-300'
            }`}
            title={isConnected ? 'Realtime Conectado' : 'Conectando WebSocket...'}
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold tracking-tight">Jarvis Paseo</h3>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <p className="text-[11px] text-amber-100/90 font-medium">
            {isConnected ? 'Paseo Aranjuez • En línea' : 'Sincronizando...'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onReset}
          className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
          title="Reiniciar conversación"
          type="button"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
          title="Minimizar chat"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
