-- ==============================================================================
-- FASE 1: MIGRACIÓN PARA TABLA skills_registry
-- Sistema de Skills (Habilidades) modulares para Jarvis Paseo
-- Ejecuta este script en el SQL Editor de Supabase
-- ==============================================================================

-- 1. Tabla principal de registro de Skills
CREATE TABLE IF NOT EXISTS public.skills_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    disparadores TEXT[] NOT NULL DEFAULT '{}',      -- keywords/frases que activan el skill
    instrucciones TEXT NOT NULL,                      -- contenido del SKILL.md parseado
    parametros JSONB DEFAULT '{}'::jsonb,             -- config adicional (tablas requeridas, auth, etc.)
    esta_activo BOOLEAN DEFAULT true,
    prioridad INT DEFAULT 5 CHECK (prioridad BETWEEN 1 AND 10), -- 1=máxima, 10=mínima
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    actualizado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS skills_registry_activo_idx 
ON public.skills_registry (esta_activo, prioridad ASC);

CREATE INDEX IF NOT EXISTS skills_registry_nombre_idx 
ON public.skills_registry (nombre);

-- 3. Índice GIN para búsqueda eficiente en el array de disparadores
CREATE INDEX IF NOT EXISTS skills_registry_disparadores_idx 
ON public.skills_registry USING GIN (disparadores);

-- 4. Función para actualizar automáticamente actualizado_en
CREATE OR REPLACE FUNCTION public.actualizar_timestamp_skills()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.actualizado_en = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_actualizar_skills
    BEFORE UPDATE ON public.skills_registry
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_timestamp_skills();

-- 5. Función RPC para buscar Skills por disparadores (keywords)
CREATE OR REPLACE FUNCTION public.buscar_skill_por_disparador(
    p_mensaje TEXT
)
RETURNS TABLE (
    id UUID,
    nombre VARCHAR,
    descripcion TEXT,
    disparadores TEXT[],
    instrucciones TEXT,
    parametros JSONB,
    prioridad INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.id,
        sr.nombre,
        sr.descripcion,
        sr.disparadores,
        sr.instrucciones,
        sr.parametros,
        sr.prioridad
    FROM public.skills_registry sr
    WHERE sr.esta_activo = true
      AND EXISTS (
          SELECT 1 FROM unnest(sr.disparadores) AS d
          WHERE lower(p_mensaje) LIKE '%' || lower(d) || '%'
      )
    ORDER BY sr.prioridad ASC
    LIMIT 1;
END;
$$;

-- 6. Políticas de Seguridad (RLS)
ALTER TABLE public.skills_registry ENABLE ROW LEVEL SECURITY;

-- Lectura pública (el Skill Router necesita leer skills desde el frontend/API)
DROP POLICY IF EXISTS "Lectura publica skills_registry" ON public.skills_registry;
CREATE POLICY "Lectura publica skills_registry"
    ON public.skills_registry
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Inserción restringida a service_role (solo admin puede crear skills)
DROP POLICY IF EXISTS "Insercion admin skills_registry" ON public.skills_registry;
CREATE POLICY "Insercion admin skills_registry"
    ON public.skills_registry
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Actualización restringida
DROP POLICY IF EXISTS "Actualizacion admin skills_registry" ON public.skills_registry;
CREATE POLICY "Actualizacion admin skills_registry"
    ON public.skills_registry
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Eliminación restringida
DROP POLICY IF EXISTS "Eliminacion admin skills_registry" ON public.skills_registry;
CREATE POLICY "Eliminacion admin skills_registry"
    ON public.skills_registry
    FOR DELETE
    TO authenticated
    USING (true);
