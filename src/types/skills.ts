import { Json } from './database';

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

/**
 * Resultado de la búsqueda de un Skill por el Skill Router.
 */
export interface SkillMatch {
  skill: Skill;
  matchType: 'exact' | 'semantic' | 'fallback';
  confidence: number; // 0-1
  matchedTrigger?: string;
}

/**
 * YAML Frontmatter de un archivo SKILL.md.
 */
export interface SkillFrontmatter {
  name: string;
  description: string;
  triggers: string[];
  priority?: number;
  requires_auth?: boolean;
  tables?: string[];
  rpcs?: string[];
  rpc_principal?: string;
  categoria?: string;
}

/**
 * Resultado de parsear un archivo SKILL.md.
 */
export interface ParsedSkillFile {
  frontmatter: SkillFrontmatter;
  instructions: string;
  rawContent: string;
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

export interface SkillListResponse {
  skills: Skill[];
  total: number;
}

export interface SkillResponse {
  success: boolean;
  skill?: Skill;
  message: string;
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

// ============================================================================
// TIPOS PARA EL QUERY ENGINE
// ============================================================================

export type RPCName = 
  | 'buscar_tiendas'
  | 'eventos_vigentes'
  | 'consultar_billetera'
  | 'recompensas_activas'
  | 'resumen_canjes_cliente'
  | 'historial_transacciones_cliente'
  | 'buscar_base_conocimiento'
  | 'buscar_skill_por_disparador';

export interface RPCCall {
  functionName: RPCName;
  params: Record<string, unknown>;
  description: string;
}

export interface QueryResult {
  rpcName: RPCName;
  data: Record<string, unknown>[] | null;
  error: string | null;
  formattedText: string;
}
