import { createClient } from '@supabase/supabase-js';
import { Skill } from '@/types/skills';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Intenta encontrar el Skill más relevante para un mensaje dado.
 * Primero busca coincidencia exacta de disparadores (keyword match),
 * luego coincidencia semántica básica por substring en la descripción.
 * Devuelve null si no encuentra ninguno.
 */
export async function routeSkill(message: string): Promise<Skill | null> {
  const lower = message.toLowerCase();

  // 1. Llamar la RPC buscar_skill_por_disparador (creada en skills_migration.sql)
  const { data, error } = await supabase.rpc('buscar_skill_por_disparador', {
    p_mensaje: lower,
  });

  if (error) {
    console.warn('[SkillRouter] Error al consultar skill por disparador:', error.message);
    return null;
  }

  if (data && (Array.isArray(data) ? data.length > 0 : true)) {
    const skill = Array.isArray(data) ? data[0] : data;
    return skill as Skill;
  }

  // 2. Fallback: coincidencia semántica básica buscando en descripciones
  const { data: allSkills, error: listErr } = await supabase
    .from('skills_registry')
    .select('*')
    .eq('esta_activo', true)
    .order('prioridad', { ascending: true });

  if (listErr || !allSkills) return null;

  for (const skill of allSkills) {
    const descWords = skill.descripcion.toLowerCase().split(/\s+/);
    const hasMatch = descWords.some((word: string) => word.length > 3 && lower.includes(word));
    if (hasMatch) {
      return skill as Skill;
    }
  }

  return null;
}

/**
 * Recupera todos los skills activos ordenados por prioridad.
 */
export async function getAllActiveSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills_registry')
    .select('*')
    .eq('esta_activo', true)
    .order('prioridad', { ascending: true });

  if (error) {
    console.error('[SkillRouter] Error al listar skills:', error.message);
    return [];
  }
  return (data || []) as Skill[];
}
