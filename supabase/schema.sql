-- Esquema para la app Minirifle FBI
-- Ejecutar en el SQL Editor de Supabase (proyecto dedicado a esta app)

create table if not exists public.sesiones (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  disparos jsonb not null, -- array de 8 rondas x 5 disparos (valores 10|9|8|7|0)
  created_at timestamptz not null default now()
);

create index if not exists sesiones_fecha_idx on public.sesiones (fecha desc);

-- App de un solo usuario, sin login: se habilita acceso completo con la anon key.
-- La anon key no debe compartirse fuera de las variables de entorno de la app.
alter table public.sesiones enable row level security;

drop policy if exists "anon full access" on public.sesiones;
create policy "anon full access" on public.sesiones
  for all
  to anon
  using (true)
  with check (true);

-- Migración para soporte offline-first (carga sin conexión + sync en background).
-- local_id identifica la sesión generada en el dispositivo (crypto.randomUUID())
-- y permite hacer upsert idempotente: si un reintento de sync se repite,
-- no se duplica la fila. Las filas antiguas quedan con local_id null,
-- lo cual es válido porque una columna unique permite múltiples NULL.
alter table public.sesiones add column if not exists local_id uuid unique;

-- Migración para la mosca (X): grilla booleana 8x5 paralela a `disparos`,
-- true donde ese disparo (que vale 10) se cargó como mosca/centro interno.
-- Las filas antiguas quedan con moscas null (0 moscas a los fines del conteo).
alter table public.sesiones add column if not exists moscas jsonb;
