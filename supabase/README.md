# Supabase Database

Las tablas principales del proyecto se definen en:

```text
supabase/migrations/20260524142000_family_schema.sql
```

## Tablas incluidas

- `familiares`
- `fotos`
- `historias`
- `documentos`
- `eventos_familiares`

## Campos importantes

`familiares` incluye los campos usados por la app:

- `nombre`
- `cedula`
- `rama_familiar`
- `rol`
- `vinculo`
- `fecha_nacimiento`
- `fecha_fallecimiento`
- `periodo`
- `lugar_origen`
- `biografia`
- `parent_id`
- `padre_id`
- `madre_id`
- `pareja_id`
- `foto_principal`
- `foto_principal_path`
- `genero`
- ubicacion y `metadata`

## Ejecucion

Ejecuta el SQL desde el SQL Editor de Supabase o con Supabase CLI cuando este instalado y vinculado al proyecto.

La llave `service_role` no debe usarse en el frontend ni subirse al repositorio.
