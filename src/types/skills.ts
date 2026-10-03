// ============================================================================
// TIPOS PARA EL SISTEMA DE SKILLS DE JARVIS PASEO
// ============================================================================

/**
 * Registro de un Skill tal como se almacena en skills_registry.
 */
export interface Skill {
  id: string;
  nombre: string;
  descripcion: string;
  disparadores: string[];
  instrucciones: string;
  parametros: SkillParametros;
  esta_activo: boolean;
  prioridad: number;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Parámetros de configuración de un Skill (columna JSONB).
 */
export interface SkillParametros {
  /** Tablas de la BDD que este skill necesita consultar */
  tablas?: string[];
  /** Si el skill requiere que el usuario esté identificado */
  requiere_auth?: boolean;
  /** RPCs de Supabase que este skill puede invocar */
  rpcs?: string[];
  /** Nombre de la función RPC principal a ejecutar */
  rpc_principal?: string;
  /** Parámetros por defecto para el RPC */
  rpc_params_default?: Record<string, unknown>;
  /** Categoría del skill para agrupar en el admin */
  categoria?: string;
  /** Metadata adicional */
  [key: string]: unknown;
}

// ============================================================================
// TIPOS PARA API CRUD DE SKILLS
// ============================================================================
export interface CreateSkillRequest {
  nombre: string;
  descripcion: string;
  disparadores: string[];
  instrucciones: string;
  parametros?: SkillParametros;
  prioridad?: number;
}

export interface UpdateSkillRequest {
  id: string;
  nombre?: string;
  descripcion?: string;
  disparadores?: string[];
  instrucciones?: string;
  parametros?: SkillParametros;
  esta_activo?: boolean;
  prioridad?: number;
}

// ============================================================================
// TIPOS PARA EL CONTEXT BUILDER
// ============================================================================

export type ContextSourceType = 'rag' | 'database' | 'skill' | 'history';

export interface ContextSource {
  type: ContextSourceType;
  label: string;
  content: string;
  priority: number; // 1=máxima
  tokenEstimate: number;
}

export interface AssembledContext {
  systemPrompt: string;
  contextText: string;
  activeSkill: Skill | null;
  sources: ContextSource[];
  totalTokenEstimate: number;
}
