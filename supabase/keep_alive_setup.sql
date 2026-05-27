-- ============================================================
-- SQL KEEP-ALIVE v3.0 (Paste in Supabase SQL Editor)
-- Proyecto: Álbum Familiar (albun-familiar)
-- ============================================================
BEGIN;

-- 1. Crear tabla de historial si no existe
CREATE TABLE IF NOT EXISTS public.health_check (
  id SERIAL PRIMARY KEY,
  last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- 2. Limpiar registros viejos (mantiene solo los últimos 10)
DO $$ 
BEGIN
    DELETE FROM public.health_check WHERE id NOT IN (
        SELECT id FROM public.health_check ORDER BY last_ping DESC LIMIT 10
    );
END $$;

-- 3. Crear función de actividad (RPC)
CREATE OR REPLACE FUNCTION keep_alive()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  INSERT INTO public.health_check (notes)
  VALUES ('Keep-alive ping (' || COALESCE(current_setting('request.method', true), 'Manual') || ')');

  DELETE FROM public.health_check WHERE id NOT IN (
    SELECT id FROM public.health_check ORDER BY last_ping DESC LIMIT 10
  );

  result := json_build_object(
    'status', 'alive',
    'timestamp', NOW()
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Permisos de ejecución global
ALTER TABLE public.health_check ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Permitir lectura anonima para keep-alive" ON public.health_check;
    CREATE POLICY "Permitir lectura anonima para keep-alive" 
    ON public.health_check FOR SELECT 
    TO anon 
    USING (true);
END $$;

GRANT SELECT ON public.health_check TO anon;
GRANT EXECUTE ON FUNCTION keep_alive() TO anon;

COMMIT;
