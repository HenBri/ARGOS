import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/gemini';
import { routeSkill } from '@/lib/skills/skill-router';
import { executeSkill } from '@/lib/skills/skill-executor';
import { AssembledContext, ContextSource, Skill } from '@/types/skills';
import { MatchedConocimiento } from '@/types/database';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MAX_CONTEXT_TOKENS = 7500; // leave ~500 for the response
const APPROX_CHARS_PER_TOKEN = 4;

/**
 * Construye el contexto completo para Jarvis combinando:
 * 1. Skill activo (mayor prioridad)
 * 2. Datos de la BDD via RPC del skill
 * 3. RAG — búsqueda vectorial en base_conocimiento
 * 4. Historial reciente de la sesión
 *
 * El total de tokens se mantiene bajo MAX_CONTEXT_TOKENS.
 */
export async function buildContext({
  message,
  sessionId,
  idCliente,
  historyText,
}: {
  message: string;
  sessionId?: string;
  idCliente?: string;
  historyText?: string;
}): Promise<AssembledContext> {
  const sources: ContextSource[] = [];
  let activeSkill: Skill | null = null;
  let totalChars = 0;

  // ── 1. Identificar Skill activo ─────────────────────────────────────────
  try {
    activeSkill = await routeSkill(message);
  } catch (e) {
    console.warn('[ContextBuilder] Skill routing falló:', e);
  }

  // ── 2. Ejecutar Skill (datos BDD) ─────────────────────────────────────
  if (activeSkill) {
    try {
      const skillText = await executeSkill(activeSkill, message, idCliente);
      const estimate = Math.ceil(skillText.length / APPROX_CHARS_PER_TOKEN);
      sources.push({
        type: 'skill',
        label: `Skill: ${activeSkill.nombre}`,
        content: skillText,
        priority: 1,
        tokenEstimate: estimate,
      });
      totalChars += skillText.length;
    } catch (e) {
      console.warn('[ContextBuilder] Skill execution falló:', e);
    }
  }

  // ── 3. RAG — búsqueda vectorial en base_conocimiento ────────────────────
  try {
    const embedding = await generateEmbedding(message);
    const { data: ragDocs, error } = await (supabase.rpc as any)(
      'buscar_base_conocimiento',
      { query_embedding: embedding, match_threshold: 0.25, match_count: 5 }
    );

    if (!error && ragDocs && ragDocs.length > 0) {
      const ragText = (ragDocs as MatchedConocimiento[])
        .map(
          (d, i) =>
            `[Doc ${i + 1} — ${d.tipo_fuente.toUpperCase()}` +
            (d.similarity ? ` | Similitud: ${(d.similarity * 100).toFixed(1)}%` : '') +
            `]\n${d.contenido}`
        )
        .join('\n\n');

      const estimate = Math.ceil(ragText.length / APPROX_CHARS_PER_TOKEN);
      sources.push({
        type: 'rag',
        label: 'Base de Conocimiento (RAG)',
        content: ragText,
        priority: 2,
        tokenEstimate: estimate,
      });
      totalChars += ragText.length;
    }
  } catch (e) {
    console.warn('[ContextBuilder] RAG falló:', e);
  }

  // ── 4. Historial de la sesión ────────────────────────────────────────────
  if (historyText && historyText.trim()) {
    const estimate = Math.ceil(historyText.length / APPROX_CHARS_PER_TOKEN);
    sources.push({
      type: 'history',
      label: 'Historial de Sesión',
      content: historyText,
      priority: 3,
      tokenEstimate: estimate,
    });
    totalChars += historyText.length;
  }

  // ── 5. Truncar para respetar límite de tokens ───────────────────────────
  const sortedSources = sources.sort((a, b) => a.priority - b.priority);
  const keptSources: ContextSource[] = [];
  let runningChars = 0;
  const maxChars = MAX_CONTEXT_TOKENS * APPROX_CHARS_PER_TOKEN;

  for (const src of sortedSources) {
    if (runningChars + src.content.length <= maxChars) {
      keptSources.push(src);
      runningChars += src.content.length;
    } else {
      // Truncar parcialmente
      const remaining = maxChars - runningChars;
      if (remaining > 200) {
        keptSources.push({
          ...src,
          content: src.content.slice(0, remaining) + '\n[... truncado para límite de tokens]',
          tokenEstimate: Math.ceil(remaining / APPROX_CHARS_PER_TOKEN),
        });
      }
      break;
    }
  }

  // ── 6. Ensamblar el texto de contexto final ─────────────────────────────
  const contextText = keptSources.map((s) => s.content).join('\n\n---\n\n');
  const totalTokenEstimate = Math.ceil(runningChars / APPROX_CHARS_PER_TOKEN);

  return {
    systemPrompt: '', // Se rellena desde gemini.ts JARVIS_BASE_SYSTEM_PROMPT
    contextText,
    activeSkill,
    sources: keptSources,
    totalTokenEstimate,
  };
}
