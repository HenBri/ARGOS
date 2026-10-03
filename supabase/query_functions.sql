-- ==============================================================================
-- FASE 3: FUNCIONES RPC PARA CONSULTAS DINÁMICAS A BDD
-- Estas funciones permiten que el motor Jarvis genere consultas SQL seguras
-- a partir de intenciones del usuario (consultas de tiendas, eventos, etc.)
-- ==============================================================================

-- 1. Tabla de whitelist de consultas permitidas (para evitar inyección)
CREATE TABLE IF NOT EXISTS public.query_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,      -- nombre interno, ex: obtener_tiendas
    descripcion TEXT NOT NULL,
    sql_template TEXT NOT NULL,               -- template con placeholders {{param}}
    parametros JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array de objetos {name, type}
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    actualizado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS query_whitelist_nombre_idx ON public.query_whitelist (nombre);

-- 2. Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION public.actualizar_timestamp_query_whitelist()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.actualizado_en = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_actualizar_query_whitelist
    BEFORE UPDATE ON public.query_whitelist
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp_query_whitelist();

-- 3. Función RPC para ejecutar una consulta basada en la whitelist
-- Parámetros:
--   p_nombre   - nombre de la consulta (coincide con whitelist)
--   p_params   - JSONB con los valores de los parámetros requeridos
-- Retorna: SETOF RECORD (el llamador debe especificar columnas)
CREATE OR REPLACE FUNCTION public.ejecutar_consulta_segura(
    p_nombre VARCHAR,
    p_params JSONB
) RETURNS SETOF RECORD
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tmpl TEXT;
    qry  TEXT;
    key  TEXT;
    val  TEXT;
BEGIN
    -- 1️⃣ Obtener plantilla
    SELECT sql_template INTO tmpl FROM public.query_whitelist WHERE nombre = p_nombre;
    IF tmpl IS NULL THEN
        RAISE EXCEPTION 'Consulta % no encontrada en whitelist', p_nombre;
    END IF;

    -- 2️⃣ Sustituir placeholders {{param}}
    qry := tmpl;
    FOR key, val IN SELECT key, value FROM jsonb_each_text(p_params) LOOP
        qry := replace(qry, '{{' || key || '}}', quote_literal(val));
    END LOOP;

    -- 3️⃣ Ejecutar consulta dinámica y devolver resultados
    RETURN QUERY EXECUTE qry;
END;
$$;

-- 4️⃣ Políticas RLS (solo autenticados pueden ejecutar)
ALTER TABLE public.query_whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whitelist_read" ON public.query_whitelist FOR SELECT TO authenticated USING (true);
CREATE POLICY "whitelist_write" ON public.query_whitelist FOR INSERT, UPDATE, DELETE TO authenticated USING (true) WITH CHECK (true);

-- 5️⃣ Función de ayuda para listar nombres disponibles (para UI)
CREATE OR REPLACE FUNCTION public.listar_consultas_permitidas()
RETURNS TABLE (nombre VARCHAR, descripcion TEXT)
LANGUAGE sql
AS $$
    SELECT nombre, descripcion FROM public.query_whitelist ORDER BY nombre;
$$;

-- 6️⃣ Ejemplo de inserción de una consulta
INSERT INTO public.query_whitelist (nombre, descripcion, sql_template, parametros)
VALUES (
    'obtener_tiendas',
    'Lista todas las tiendas con opcional filtro por categoría',
    $$SELECT id, nombre, categoria FROM tiendas WHERE ({{categoria}} IS NULL OR categoria = {{categoria}})$$,
    '[{"name":"categoria","type":"text"}]'::jsonb
) ON CONFLICT (nombre) DO UPDATE SET
    descripcion = EXCLUDED.descripcion,
    sql_template = EXCLUDED.sql_template,
    parametros = EXCLUDED.parametros;

-- 7️⃣ Comentario: La lógica del motor Jarvis (en TypeScript) debe
--    traducir la intención del usuario a un nombre de consulta y
--    mapear los parámetros detectados antes de llamar a esta RPC.

-- ==============================================================================
-- FIN DE FASE 3
-- ==============================================================================
