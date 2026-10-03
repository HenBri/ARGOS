'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, ChevronDown, AlertCircle, Sparkles } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import { QuickSuggestions } from './QuickSuggestions';
import { supabaseClient } from '@/lib/supabase/client';
import { ChatUIMessage, SendMessageResponse } from '@/types/chat';
import { HistorialChat } from '@/types/database';
import { useVoiceConversation } from '@/hooks/useVoiceConversation';

const SESSION_STORAGE_KEY = 'paseo_aranjuez_chat_session_id';

const INITIAL_GREETING: ChatUIMessage = {
  id: 'greeting-initial',
  role: 'model',
  content:
    '¡Hola! 👋 Soy Jarvis Paseo, el asistente virtual de Paseo Aranjuez.\n\n¿En qué puedo orientarte hoy? Puedes consultarme sobre:\n* 🎁 Programa Paseo Points (cómo acumular con tu código QR y canjear premios)\n* 📍 Tiendas, pisos y números de local (Café Typica, Multicine, Fair Play, etc.)\n* 🎭 Eventos culturales, talleres y música en vivo en la Terraza\n* 🕒 Horarios de atención y servicios del centro comercial\n* 🚗 Estacionamiento subterráneo y validación de horas gratis',
  created_at: new Date().toISOString(),
};

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatUIMessage[]>([INITIAL_GREETING]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Conversation integration
  const {
    voiceState,
    startVoiceMode,
    stopVoiceMode,
    skipCurrentSpeech,
  } = useVoiceConversation({
    sessionId,
    onMessageSent: (text) => {
      // Optimistically add user voice message
      const tempUserId = `temp-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempUserId,
          role: 'user',
          content: text,
          created_at: new Date().toISOString(),
        },
      ]);
      // We don't call handleSendMessage here because useVoiceConversation handles its own fetch to /api/chat.
      // But we DO want to see the UI update.
    },
    onResponseReceived: (text) => {
      // The Realtime subscription will handle appending the final model message to the list!
    }
  });

  // 1. Inicializar o restaurar Session ID desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedId) {
        setSessionId(storedId);
        // Cargar historial previo de esta sesión desde historial_chats
        fetch(`/api/messages?sessionId=${storedId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.chats && data.chats.length > 0) {
              const loadedMessages: ChatUIMessage[] = [INITIAL_GREETING];
              data.chats.forEach((chat: HistorialChat) => {
                loadedMessages.push({
                  id: `${chat.id}-user`,
                  role: 'user',
                  content: chat.mensaje_usuario,
                  created_at: chat.creado_en || '',
                });
                loadedMessages.push({
                  id: `${chat.id}-model`,
                  role: 'model',
                  content: chat.respuesta_ia,
                  created_at: chat.creado_en || '',
                });
              });
              setMessages(loadedMessages);
            }
          })
          .catch((err) => console.warn('No se pudo cargar historial previo de chats:', err));
      }
    }
  }, []);

  // 2. Scroll automático al último mensaje
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen, scrollToBottom]);

  // 3. Suscripción Reactiva a Supabase Realtime (WebSockets sobre historial_chats)
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabaseClient
      .channel(`historial_chats_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'historial_chats',
          filter: `id_sesion=eq.${sessionId}`,
        },
        (payload) => {
          const incoming = payload.new as HistorialChat;
          const userMsgId = `${incoming.id}-user`;
          const modelMsgId = `${incoming.id}-model`;

          setMessages((prev) => {
            // Verificar si el mensaje del modelo ya fue procesado
            if (prev.some((m) => m.id === modelMsgId)) {
              return prev;
            }

            // Remover cualquier mensaje temporal de optimismo pendiente
            const filtered = prev.filter((m) => !m.id.startsWith('temp-'));

            // Asegurar que tanto la pregunta como la respuesta de la fila estén en el estado
            const nextList = [...filtered];
            if (!nextList.some((m) => m.id === userMsgId)) {
              nextList.push({
                id: userMsgId,
                role: 'user',
                content: incoming.mensaje_usuario,
                created_at: incoming.creado_en || new Date().toISOString(),
              });
            }
            nextList.push({
              id: modelMsgId,
              role: 'model',
              content: incoming.respuesta_ia,
              created_at: incoming.creado_en || new Date().toISOString(),
            });

            return nextList;
          });

          if (!isOpen) {
            setUnreadCount((count) => count + 1);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [sessionId, isOpen]);

  // 4. Envío de mensajes al backend RAG de Jarvis
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    const tempUserId = `temp-${Date.now()}`;
    const optimisticUserMsg: ChatUIMessage = {
      id: tempUserId,
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          sessionId: sessionId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al comunicarse con Jarvis Paseo.');
      }

      const data: SendMessageResponse = await response.json();

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
      }

      // Conciliar mensaje optimista con la fila confirmada de historial_chats
      setMessages((prev) => {
        const userMsgId = `${data.record.id}-user`;
        const modelMsgId = `${data.record.id}-model`;

        // Si ya llegó por Realtime
        if (prev.some((m) => m.id === modelMsgId)) {
          return prev.filter((m) => m.id !== tempUserId);
        }

        const filtered = prev.filter((m) => m.id !== tempUserId);
        return [
          ...filtered,
          {
            id: userMsgId,
            role: 'user',
            content: data.record.mensaje_usuario,
            created_at: data.record.creado_en || new Date().toISOString(),
          },
          {
            id: modelMsgId,
            role: 'model',
            content: data.record.respuesta_ia,
            created_at: data.record.creado_en || new Date().toISOString(),
          },
        ];
      });
    } catch (err) {
      console.error('[ChatWidget Error]:', err);
      setError(err instanceof Error ? err.message : 'Error inesperado al enviar mensaje a Jarvis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    setSessionId(null);
    setMessages([INITIAL_GREETING]);
    setError(null);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Ventana Expandida del Chat */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[420px] h-[580px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-fadeInUp">
          <ChatHeader
            onClose={() => setIsOpen(false)}
            onReset={handleReset}
            isConnected={isConnected}
          />

          <div className="flex-1 overflow-y-auto p-4 space-y-1 chat-scrollbar bg-slate-50/40">
            {messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 my-2 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-rose-600 text-white flex items-center justify-center text-xs shadow-sm">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 my-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <p className="font-semibold">No se pudo procesar tu mensaje</p>
                  <p className="mt-0.5 text-[11px] text-rose-600">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <QuickSuggestions onSelect={handleSendMessage} disabled={isLoading || voiceState.isVoiceMode} />
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
            voicePhase={voiceState.phase}
            isVoiceMode={voiceState.isVoiceMode}
            onVoiceStart={startVoiceMode}
            onVoiceStop={stopVoiceMode}
            onVoiceSkip={skipCurrentSpeech}
          />
        </div>
      )}

      {/* Botón Flotante Toggle */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        aria-label={isOpen ? 'Cerrar chat' : 'Hablar con Jarvis Paseo'}
        className={`relative mt-3 flex items-center gap-2.5 px-4 py-3 rounded-full text-white font-medium shadow-xl hover:shadow-2xl transition-all duration-300 transform active:scale-95 ${
          isOpen
            ? 'bg-slate-800 hover:bg-slate-900 ring-2 ring-slate-700/50'
            : 'bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 hover:from-amber-500 hover:to-indigo-600'
        }`}
      >
        {isOpen ? (
          <>
            <ChevronDown className="w-5 h-5" />
            <span className="text-sm">Ocultar Jarvis</span>
          </>
        ) : (
          <>
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-full ring-2 ring-white animate-bounce">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="text-sm tracking-wide">Hablar con Jarvis</span>
            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </>
        )}
      </button>
    </div>
  );
};
