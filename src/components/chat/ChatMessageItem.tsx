'use client';

import React from 'react';
import { Bot, User } from 'lucide-react';
import { ChatUIMessage } from '@/types/chat';

interface ChatMessageItemProps {
  message: ChatUIMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Formateador de texto amigable para listas y saltos de línea
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const bulletText = line.trim().substring(2);
        return (
          <li key={idx} className="ml-4 list-disc leading-relaxed">
            {bulletText}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="leading-relaxed">
          {line}
        </p>
      );
    });
  };

  const formattedTime = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      className={`flex items-end gap-2.5 my-2.5 transition-all duration-200 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-sm ${
          isUser
            ? 'bg-slate-700 text-white'
            : 'bg-gradient-to-tr from-rose-600 via-amber-600 to-indigo-600 text-white'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Burbuja de mensaje */}
      <div
        className={`max-w-[84%] px-4 py-3 rounded-2xl text-[13.5px] shadow-sm ${
          isUser
            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-br-none'
            : 'bg-white text-slate-800 border border-slate-100/90 rounded-bl-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
        }`}
      >
        <div className="space-y-1">{renderFormattedText(message.content)}</div>

        {formattedTime && (
          <div
            className={`text-[10px] mt-1.5 flex items-center gap-1 select-none ${
              isUser ? 'justify-end text-indigo-200' : 'justify-start text-slate-400'
            }`}
          >
            <span>{formattedTime}</span>
          </div>
        )}
      </div>
    </div>
  );
};
