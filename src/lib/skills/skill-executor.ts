import { Skill, SkillParametros } from '@/types/skills';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Ejecuta un Skill:
 * 1. Lee los `parametros` del Skill para saber qué RPC invocar (si corresponde).
 * 2. Llama al RPC correspondiente con los parámetros extraídos del mensaje.
 * 3. Devuelve un bloque de texto formateado listo para insertarse en el contexto de Gemini.
 */
export async function executeSkill(
  skill: Skill,
  message: string,
  idCliente?: string
): Promise<string> {
  const params = (skill.parametros || {}) as SkillParametros;
  const rpc = params.rpc_principal;

  if (!rpc) {
    // Skill de solo instrucciones, no invoca RPC
    return formatSkillInstructions(skill);
  }

  // Extraer parámetros dinámicos desde el mensaje
  const rpcParams = buildRpcParams(rpc, message, idCliente, params.rpc_params_default);

  try {
    const { data, error } = await (supabase.rpc as any)(rpc, rpcParams);
    if (error) {
      console.warn(`[SkillExecutor] RPC ${rpc} error:`, error.message);
      return formatSkillInstructions(skill);
    }
    return formatRpcResult(skill, rpc, data);
  } catch (e) {
    console.error(`[SkillExecutor] Error ejecutando RPC ${rpc}:`, e);
    return formatSkillInstructions(skill);
  }
}

/**
 * Formatea el bloque de instrucciones del Skill para el contexto de Gemini.
 */
function formatSkillInstructions(skill: Skill): string {
  return `[SKILL ACTIVO: ${skill.nombre.toUpperCase()}]\n` +
    `Descripción: ${skill.descripcion}\n\n` +
    `Instrucciones específicas para este Skill:\n${skill.instrucciones}`;
}

/**
 * Formatea el resultado de una llamada RPC en texto legible para Gemini.
 */
function formatRpcResult(skill: Skill, rpc: string, data: unknown): string {
  const header = `[SKILL: ${skill.nombre.toUpperCase()} | Datos de la Base de Datos]`;

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return `${header}\nNo se encontraron resultados para la consulta.`;
  }

  const rows = Array.isArray(data) ? data : [data];

  // Formatear según el tipo de RPC
  switch (rpc) {
    case 'buscar_tiendas':
      return `${header}\n${rows.map((r: any) =>
        `• ${r.nombre} — Piso ${r.piso}, Local ${r.numero_local}` +
        (r.referencia_ubicacion ? ` (${r.referencia_ubicacion})` : '') +
        (r.horario_atencion ? ` | Horario: ${r.horario_atencion}` : '')
      ).join('\n')}`;

    case 'eventos_vigentes':
      return `${header}\n${rows.map((r: any) =>
        `• ${r.titulo}` +
        (r.fecha_inicio ? ` — ${new Date(r.fecha_inicio).toLocaleDateString('es-BO')}` : '') +
        (r.lugar ? ` en ${r.lugar}` : '') +
        (r.descripcion ? `\n  ${r.descripcion}` : '')
      ).join('\n')}`;

    case 'consultar_billetera':
      const b = rows[0] as any;
      return `${header}\n` +
        `Cliente: ${b.nombre_completo}\n` +
        `Saldo: ${b.saldo_puntos} puntos\n` +
        `Nivel: ${b.nivel}\n` +
        `Puntos para siguiente nivel (${b.siguiente_nivel}): ${b.puntos_para_siguiente_nivel}`;

    case 'recompensas_activas':
      return `${header}\n${rows.map((r: any) =>
        `• ${r.titulo} — ${r.puntos_requeridos} puntos` +
        (r.nombre_tienda ? ` (${r.nombre_tienda})` : '')
      ).join('\n')}`;

    case 'resumen_canjes_cliente':
      return `${header}\n${rows.map((r: any) =>
        `• ${r.titulo_recompensa} — ${r.puntos_utilizados} puntos — Estado: ${r.estado}`
      ).join('\n')}`;

    default:
      return `${header}\n${JSON.stringify(rows, null, 2)}`;
  }
}

/**
 * Construye los parámetros del RPC a partir del mensaje y defaults del Skill.
 */
function buildRpcParams(
  rpc: string,
  message: string,
  idCliente?: string,
  defaults?: Record<string, unknown>
): Record<string, unknown> {
  const base = { ...(defaults || {}) };

  switch (rpc) {
    case 'buscar_tiendas': {
      // Extraer piso si se menciona
      const pisoMatch = message.match(/piso\s*(\d)/i);
      return {
        filtro_nombre: null,
        filtro_categoria: null,
        filtro_piso: pisoMatch ? parseInt(pisoMatch[1]) : null,
        ...base,
      };
    }
    case 'eventos_vigentes':
      return { filtro_lugar: null, limite: 5, ...base };

    case 'consultar_billetera':
    case 'resumen_canjes_cliente':
    case 'historial_transacciones_cliente':
      return { p_id_cliente: idCliente || null, ...base };

    case 'recompensas_activas':
      return { filtro_puntos_max: null, ...base };

    default:
      return base;
  }
}
