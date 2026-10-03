-- ==============================================================================
-- ESQUEMA DE BASE DE DATOS PARA ASISTENTE VIRTUAL DE CENTRO COMERCIAL
-- SUPABASE POSTGRESQL + PGVECTOR + REALTIME
-- ==============================================================================

-- 1. Habilitar la extensión de pgvector para búsqueda semántica
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabla para almacenar el conocimiento (RAG) del Centro Comercial
-- Nota: text-embedding-004 de Google Gemini genera vectores de 768 dimensiones.
CREATE TABLE IF NOT EXISTS public.mall_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    category TEXT NOT NULL, -- Ej: 'horarios', 'tiendas', 'gastronomia', 'estacionamiento', 'servicios'
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(768) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice HNSW optimizado para búsquedas por similitud de coseno
CREATE INDEX IF NOT EXISTS mall_knowledge_embedding_idx 
ON public.mall_knowledge 
USING hnsw (embedding vector_cosine_ops);

-- Índice secundario por categoría para filtrados rápidos
CREATE INDEX IF NOT EXISTS mall_knowledge_category_idx 
ON public.mall_knowledge (category);

-- 3. Tabla para sesiones de conversación
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla para los mensajes del chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice para recuperar rápidamente el historial cronológico por sesión
CREATE INDEX IF NOT EXISTS chat_messages_session_idx 
ON public.chat_messages (session_id, created_at ASC);

-- 5. Configuración de Supabase Realtime para chat_messages
-- Permite que los clientes suscritos reciban inserciones instantáneas vía WebSockets
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- 6. Función RPC para búsqueda por similitud de coseno
CREATE OR REPLACE FUNCTION public.match_mall_knowledge (
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.40,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    category TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        mk.id,
        mk.content,
        mk.category,
        1 - (mk.embedding <=> query_embedding) AS similarity
    FROM public.mall_knowledge mk
    WHERE 1 - (mk.embedding <=> query_embedding) > match_threshold
    ORDER BY mk.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 7. Políticas de Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.mall_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para mall_knowledge: Lectura pública anónima, escritura restringida a service_role
CREATE POLICY "Permitir lectura publica de conocimiento"
    ON public.mall_knowledge
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Políticas para chat_sessions: Creación y lectura de sesiones
CREATE POLICY "Permitir crear sesiones de chat anonimas"
    ON public.chat_sessions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Permitir leer sesiones de chat"
    ON public.chat_sessions
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Políticas para chat_messages: Inserción y lectura de mensajes
CREATE POLICY "Permitir insercion de mensajes"
    ON public.chat_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Permitir lectura de mensajes de la sesion"
    ON public.chat_messages
    FOR SELECT
    TO anon, authenticated
    USING (true);
