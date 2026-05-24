-- 1. Agregar columna 'creado_por' a las tablas principales
ALTER TABLE public.familiares ADD COLUMN IF NOT EXISTS creado_por uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.fotos ADD COLUMN IF NOT EXISTS creado_por uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.historias ADD COLUMN IF NOT EXISTS creado_por uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS creado_por uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.eventos_familiares ADD COLUMN IF NOT EXISTS creado_por uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Crear función helper para verificar si el usuario es administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
begin
  return (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    or auth.jwt() ->> 'email' = 'maikrp@gmail.com'
  );
end;
$$;

-- 3. Habilitar RLS (ya están habilitados, pero re-aseguramos)
ALTER TABLE public.familiares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_familiares ENABLE ROW LEVEL SECURITY;

-- 4. Actualizar políticas de RLS para familiares
DROP POLICY IF EXISTS "authenticated read familiares" ON public.familiares;
CREATE POLICY "authenticated read familiares"
ON public.familiares FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "authenticated write familiares" ON public.familiares;
DROP POLICY IF EXISTS "authenticated insert familiares" ON public.familiares;
DROP POLICY IF EXISTS "authenticated update familiares" ON public.familiares;
DROP POLICY IF EXISTS "authenticated delete familiares" ON public.familiares;

CREATE POLICY "authenticated insert familiares"
ON public.familiares FOR INSERT
TO authenticated
WITH CHECK (true); -- El default es auth.uid() para creado_por

CREATE POLICY "authenticated update familiares"
ON public.familiares FOR UPDATE
TO authenticated
USING (is_admin() OR creado_por = auth.uid())
WITH CHECK (is_admin() OR creado_por = auth.uid());

CREATE POLICY "authenticated delete familiares"
ON public.familiares FOR DELETE
TO authenticated
USING (is_admin() OR creado_por = auth.uid());

-- 5. Actualizar políticas de RLS para fotos
DROP POLICY IF EXISTS "authenticated read fotos" ON public.fotos;
CREATE POLICY "authenticated read fotos"
ON public.fotos FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "authenticated write fotos" ON public.fotos;
DROP POLICY IF EXISTS "authenticated insert fotos" ON public.fotos;
DROP POLICY IF EXISTS "authenticated update fotos" ON public.fotos;
DROP POLICY IF EXISTS "authenticated delete fotos" ON public.fotos;

CREATE POLICY "authenticated insert fotos"
ON public.fotos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated update fotos"
ON public.fotos FOR UPDATE
TO authenticated
USING (is_admin() OR creado_por = auth.uid())
WITH CHECK (is_admin() OR creado_por = auth.uid());

CREATE POLICY "authenticated delete fotos"
ON public.fotos FOR DELETE
TO authenticated
USING (is_admin() OR creado_por = auth.uid());

-- 6. Actualizar políticas de RLS para historias
DROP POLICY IF EXISTS "authenticated read historias" ON public.historias;
CREATE POLICY "authenticated read historias"
ON public.historias FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "authenticated write historias" ON public.historias;
DROP POLICY IF EXISTS "authenticated insert historias" ON public.historias;
DROP POLICY IF EXISTS "authenticated update historias" ON public.historias;
DROP POLICY IF EXISTS "authenticated delete historias" ON public.historias;

CREATE POLICY "authenticated insert historias"
ON public.historias FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated update historias"
ON public.historias FOR UPDATE
TO authenticated
USING (is_admin() OR creado_por = auth.uid())
WITH CHECK (is_admin() OR creado_por = auth.uid());

CREATE POLICY "authenticated delete historias"
ON public.historias FOR DELETE
TO authenticated
USING (is_admin() OR creado_por = auth.uid());

-- 7. Actualizar políticas de RLS para documentos
DROP POLICY IF EXISTS "authenticated read documentos" ON public.documentos;
CREATE POLICY "authenticated read documentos"
ON public.documentos FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "authenticated write documentos" ON public.documentos;
DROP POLICY IF EXISTS "authenticated insert documentos" ON public.documentos;
DROP POLICY IF EXISTS "authenticated update documentos" ON public.documentos;
DROP POLICY IF EXISTS "authenticated delete documentos" ON public.documentos;

CREATE POLICY "authenticated insert documentos"
ON public.documentos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated update documentos"
ON public.documentos FOR UPDATE
TO authenticated
USING (is_admin() OR creado_por = auth.uid())
WITH CHECK (is_admin() OR creado_por = auth.uid());

CREATE POLICY "authenticated delete documentos"
ON public.documentos FOR DELETE
TO authenticated
USING (is_admin() OR creado_por = auth.uid());

-- 8. Actualizar políticas de RLS para eventos_familiares
DROP POLICY IF EXISTS "authenticated read eventos_familiares" ON public.eventos_familiares;
CREATE POLICY "authenticated read eventos_familiares"
ON public.eventos_familiares FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "authenticated write eventos_familiares" ON public.eventos_familiares;
DROP POLICY IF EXISTS "authenticated insert eventos_familiares" ON public.eventos_familiares;
DROP POLICY IF EXISTS "authenticated update eventos_familiares" ON public.eventos_familiares;
DROP POLICY IF EXISTS "authenticated delete eventos_familiares" ON public.eventos_familiares;

CREATE POLICY "authenticated insert eventos_familiares"
ON public.eventos_familiares FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated update eventos_familiares"
ON public.eventos_familiares FOR UPDATE
TO authenticated
USING (is_admin() OR creado_por = auth.uid())
WITH CHECK (is_admin() OR creado_por = auth.uid());

CREATE POLICY "authenticated delete eventos_familiares"
ON public.eventos_familiares FOR DELETE
TO authenticated
USING (is_admin() OR creado_por = auth.uid());
