import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { sendJarvisMessageWithFallback } from '@/lib/gemini';
import { buildContext } from '@/lib/context/builder';
import { SendMessageRequest, SendMessageResponse } from '@/types/chat';
import { HistorialChat } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body: SendMessageRequest & { voiceMode?: boolean } = await req.json();
    const { message, sessionId: incomingSessionId, idCliente, voiceMode } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'El mensaje del usuario es requerido y no puede estar vacío.' },
        { status: 400 }
      );
    }

    const currentSessionId: string = incomingSessionId || crypto.randomUUID();

    // 1. Recuperar historial previo (los 5 turnos más recientes)
    const { data: rawHistory, error: historyErr } = await supabaseServer
      .from('historial_chats')
      .select('*')
      .eq('id_sesion', currentSessionId)
      .order('creado_en', { ascending: false })
      .limit(5);

    if (historyErr) {
      console.warn('[History Fetch Warning]:', historyErr.message);
    }

    const previousTurns = ((rawHistory as HistorialChat[] | null) || []).reverse();

    // 2. Formatear historial como texto para el Context Builder
    const historyText = previousTurns
      .map((t) => `Usuario: ${t.mensaje_usuario}\nJarvis: ${t.respuesta_ia}`)
      .join('\n\n');

    // 3. Preparar historial en formato Gemini
    const geminiHistory: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
    previousTurns.forEach((turn) => {
      geminiHistory.push({ role: 'user', parts: [{ text: turn.mensaje_usuario }] });
      geminiHistory.push({ role: 'model', parts: [{ text: turn.respuesta_ia }] });
    });

    // 4. Construir contexto multi-fuente (Skills + RAG + Historial)
    const { contextText, activeSkill, sources, totalTokenEstimate } = await buildContext({
      message,
      sessionId: currentSessionId,
      idCliente,
      historyText,
    });

    console.log(
      `[Chat] Contexto ensamblado: ${sources.map((s) => s.label).join(', ')} | ~${totalTokenEstimate} tokens` +
      (activeSkill ? ` | Skill: ${activeSkill.nombre}` : '')
    );

    // 5. Si es modo voz, ajustar el contexto para respuestas más concisas
    const voiceContextSuffix = voiceMode
      ? '\n\n[MODO VOZ ACTIVO]: Responde de forma concisa (máx. 2-3 oraciones). Evita listas con viñetas; usa lenguaje natural conversacional.'
      : '';

    // 6. Enviar a Gemini con fallback automático
    const modelTextResponse = await sendJarvisMessageWithFallback({
      message,
      history: geminiHistory,
      contextText: contextText + voiceContextSuffix,
    });

    // 7. Persistir en historial_chats
    const { data: insertedChatRecord, error: insertErr } = await (supabaseServer
      .from('historial_chats') as any)
      .insert({
        id_sesion: currentSessionId,
        id_cliente: idCliente || null,
        mensaje_usuario: message.trim(),
        respuesta_ia: modelTextResponse,
      })
      .select('*')
      .single();

    if (insertErr || !insertedChatRecord) {
      console.error('[Insert historial_chats Error]:', insertErr);
      return NextResponse.json(
        { error: 'Error al persistir la conversación en historial_chats.' },
        { status: 500 }
      );
    }

    const responsePayload: SendMessageResponse & { activeSkill?: string } = {
      sessionId: currentSessionId,
      record: insertedChatRecord as HistorialChat,
      sources: sources.map((s) => ({
        id: s.label,
        tipo_fuente: s.type,
        contenido: s.content.slice(0, 200) + '...',
        similarity: s.priority,
      })) as any,
      activeSkill: activeSkill?.nombre,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error('[Chat API Global Error]:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error interno al procesar la consulta en Jarvis.',
      },
      { status: 500 }
    );
  }
}
