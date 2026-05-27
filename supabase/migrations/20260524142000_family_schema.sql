create extension if not exists "pgcrypto";

create table if not exists public.familiares (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  nombre text not null,
  cedula text,
  rama_familiar text not null,
  rol text,
  vinculo text,
  fecha_nacimiento text,
  fecha_fallecimiento text,
  periodo text,
  lugar_origen text,
  biografia text,
  padre_id uuid references public.familiares(id) on delete set null,
  madre_id uuid references public.familiares(id) on delete set null,
  pareja_id uuid references public.familiares(id) on delete set null,
  parent_id uuid references public.familiares(id) on delete set null,
  foto_principal text,
  foto_principal_path text,
  genero text,
  ubicacion_lat numeric,
  ubicacion_lng numeric,
  ubicacion_descripcion text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.fotos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  familiar_id uuid references public.familiares(id) on delete set null,
  titulo text not null,
  descripcion text,
  rama_familiar text,
  fecha_aproximada text,
  url text not null,
  storage_path text,
  mime_type text not null default 'image/webp',
  width integer,
  height integer,
  size_bytes integer,
  tipo text not null default 'foto',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.historias (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  familiar_id uuid references public.familiares(id) on delete cascade,
  titulo text not null,
  contenido text not null,
  tipo text not null default 'historia',
  audio_url text,
  video_url text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  familiar_id uuid references public.familiares(id) on delete set null,
  titulo text not null,
  tipo text not null,
  descripcion text,
  url text not null,
  storage_path text,
  fecha_documento text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.eventos_familiares (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  familiar_id uuid references public.familiares(id) on delete set null,
  titulo text not null,
  fecha text,
  descripcion text,
  rama_familiar text,
  foto_url text,
  documento_url text,
  ubicacion_lat numeric,
  ubicacion_lng numeric,
  ubicacion_descripcion text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_familiares_cedula on public.familiares (cedula);
create index if not exists idx_familiares_rama on public.familiares (rama_familiar);
create index if not exists idx_familiares_parent on public.familiares (parent_id);
create index if not exists idx_fotos_familiar on public.fotos (familiar_id);
create index if not exists idx_historias_familiar on public.historias (familiar_id);
create index if not exists idx_documentos_familiar on public.documentos (familiar_id);
create index if not exists idx_eventos_familiar on public.eventos_familiares (familiar_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_familiares_updated_at on public.familiares;
create trigger set_familiares_updated_at
before update on public.familiares
for each row execute function public.set_updated_at();

drop trigger if exists set_fotos_updated_at on public.fotos;
create trigger set_fotos_updated_at
before update on public.fotos
for each row execute function public.set_updated_at();

drop trigger if exists set_historias_updated_at on public.historias;
create trigger set_historias_updated_at
before update on public.historias
for each row execute function public.set_updated_at();

drop trigger if exists set_documentos_updated_at on public.documentos;
create trigger set_documentos_updated_at
before update on public.documentos
for each row execute function public.set_updated_at();

drop trigger if exists set_eventos_familiares_updated_at on public.eventos_familiares;
create trigger set_eventos_familiares_updated_at
before update on public.eventos_familiares
for each row execute function public.set_updated_at();

alter table public.familiares enable row level security;
alter table public.fotos enable row level security;
alter table public.historias enable row level security;
alter table public.documentos enable row level security;
alter table public.eventos_familiares enable row level security;

drop policy if exists "authenticated read familiares" on public.familiares;
create policy "authenticated read familiares"
on public.familiares for select
to authenticated
using (true);

drop policy if exists "authenticated write familiares" on public.familiares;
create policy "authenticated write familiares"
on public.familiares for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read fotos" on public.fotos;
create policy "authenticated read fotos"
on public.fotos for select
to authenticated
using (true);

drop policy if exists "authenticated write fotos" on public.fotos;
create policy "authenticated write fotos"
on public.fotos for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read historias" on public.historias;
create policy "authenticated read historias"
on public.historias for select
to authenticated
using (true);

drop policy if exists "authenticated write historias" on public.historias;
create policy "authenticated write historias"
on public.historias for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read documentos" on public.documentos;
create policy "authenticated read documentos"
on public.documentos for select
to authenticated
using (true);

drop policy if exists "authenticated write documentos" on public.documentos;
create policy "authenticated write documentos"
on public.documentos for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read eventos_familiares" on public.eventos_familiares;
create policy "authenticated read eventos_familiares"
on public.eventos_familiares for select
to authenticated
using (true);

drop policy if exists "authenticated write eventos_familiares" on public.eventos_familiares;
create policy "authenticated write eventos_familiares"
on public.eventos_familiares for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('family-media', 'family-media', true, 10485760, array['image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "authenticated can upload family media" on storage.objects;
create policy "authenticated can upload family media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'family-media');

drop policy if exists "authenticated can read family media" on storage.objects;
create policy "authenticated can read family media"
on storage.objects for select
to authenticated
using (bucket_id = 'family-media');

drop policy if exists "authenticated can update family media" on storage.objects;
create policy "authenticated can update family media"
on storage.objects for update
to authenticated
using (bucket_id = 'family-media')
with check (bucket_id = 'family-media');

drop policy if exists "authenticated can delete family media" on storage.objects;
create policy "authenticated can delete family media"
on storage.objects for delete
to authenticated
using (bucket_id = 'family-media');
