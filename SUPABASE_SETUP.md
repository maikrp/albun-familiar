# Supabase Setup

Este proyecto usa Supabase solo con la llave anonima publica en el frontend.

No uses la llave `service_role` en React, Vite, `.env`, GitHub, Vercel ni Netlify. Esa llave solo debe quedar en respaldo local seguro o en funciones del servidor.

## Variables necesarias

Configura estas variables en tu entorno local o en el proveedor de despliegue:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_SUPABASE_MEDIA_BUCKET=family-media
```

## Bucket recomendado

Crea un bucket llamado:

```text
family-media
```

Para prototipo puede ser publico. Para produccion familiar privada, conviene hacerlo privado y entregar imagenes con URLs firmadas desde un backend o Edge Function.

## Politicas recomendadas

Para prototipo autenticado:

```sql
create policy "authenticated can upload family media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'family-media');

create policy "authenticated can read family media"
on storage.objects for select
to authenticated
using (bucket_id = 'family-media');
```

Si el bucket sera publico, puedes permitir lectura publica, pero no escritura publica.

## Control de uso

La app convierte imagenes a WebP antes de subirlas:

- Maximo de archivo fuente: 10 MB.
- Dimension maxima: 1600 px en el lado mayor.
- Formato final: WebP.
- Calidad: 82%.
- `upsert: false` para evitar sobrescrituras accidentales.

Esto ayuda a evitar saturacion de Storage y consumo innecesario de ancho de banda.

## Base de datos

La migracion SQL esta en:

```text
supabase/migrations/20260524142000_family_schema.sql
```

Incluye tablas para:

- familiares
- fotos
- historias
- documentos
- eventos familiares

Ejecutala desde el SQL Editor de Supabase o con Supabase CLI cuando tengas el proyecto vinculado.
