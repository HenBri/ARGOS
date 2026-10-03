-- ==============================================================================
-- PASEO ARANJUEZ: CONFIGURACIÓN ADICIONAL PARA RAG Y REALTIME (SUPABASE)
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase existente
-- ==============================================================================

-- 1. Habilitar la extensión de pgvector (si aún no está habilitada)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Asegurar que vector_embebido tenga la dimensión adecuada para Gemini (768)
-- Si la columna ya existía como tipo 'vector' genérico, puedes asegurar la dimensión:
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.base_conocimiento 
        ALTER COLUMN vector_embebido TYPE VECTOR(768);
    EXCEPTION
        WHEN OTHERS THEN
            NULL; -- Si ya tiene 768 o datos incompatibles, no interrumpe
    END;
END $$;

-- 3. Crear índice HNSW para acelerar las búsquedas vectoriales por similitud de coseno
CREATE INDEX IF NOT EXISTS base_conocimiento_vector_idx 
ON public.base_conocimiento 
USING hnsw (vector_embebido vector_cosine_ops);

-- Índice por tipo de fuente para filtrados rápidos
CREATE INDEX IF NOT EXISTS base_conocimiento_tipo_idx 
ON public.base_conocimiento (tipo_fuente);

-- 4. Índice para consultar rápidamente el historial de chats por sesión
CREATE INDEX IF NOT EXISTS historial_chats_sesion_idx 
ON public.historial_chats (id_sesion, creado_en ASC);

-- 5. Activar Supabase Realtime para la tabla historial_chats (WebSockets)
-- Esto permite que el widget en Next.js reciba en vivo las respuestas y preguntas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'historial_chats'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.historial_chats;
    END IF;
END $$;

ALTER TABLE public.historial_chats REPLICA IDENTITY FULL;

-- 6. Función RPC para búsqueda semántica por similitud de coseno
CREATE OR REPLACE FUNCTION public.buscar_base_conocimiento (
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.25,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    tipo_fuente VARCHAR,
    id_fuente UUID,
    contenido TEXT,
    metadatos JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        bc.id,
        bc.tipo_fuente,
        bc.id_fuente,
        bc.contenido,
        bc.metadatos,
        1 - (bc.vector_embebido <=> query_embedding) AS similarity
    FROM public.base_conocimiento bc
    WHERE bc.vector_embebido IS NOT NULL
      AND (1 - (bc.vector_embebido <=> query_embedding)) > match_threshold
    ORDER BY bc.vector_embebido <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 7. Políticas de Seguridad a Nivel de Fila (RLS) seguras y permisivas para el asistente
ALTER TABLE public.base_conocimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recompensas ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para datos del mall
DROP POLICY IF EXISTS "Lectura publica base_conocimiento" ON public.base_conocimiento;
CREATE POLICY "Lectura publica base_conocimiento" 
    ON public.base_conocimiento FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Lectura publica tiendas" ON public.tiendas;
CREATE POLICY "Lectura publica tiendas" 
    ON public.tiendas FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Lectura publica eventos" ON public.eventos;
CREATE POLICY "Lectura publica eventos" 
    ON public.eventos FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Lectura publica recompensas" ON public.recompensas;
CREATE POLICY "Lectura publica recompensas" 
    ON public.recompensas FOR SELECT TO anon, authenticated USING (true);

-- Políticas para historial de chats (lectura e inserción)
DROP POLICY IF EXISTS "Insercion publica historial_chats" ON public.historial_chats;
CREATE POLICY "Insercion publica historial_chats" 
    ON public.historial_chats FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura publica historial_chats" ON public.historial_chats;
CREATE POLICY "Lectura publica historial_chats" 
    ON public.historial_chats FOR SELECT TO anon, authenticated USING (true);
