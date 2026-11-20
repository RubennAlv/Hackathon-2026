-- OPCIONAL: coordenadas reales de los locales registrados.
-- Ejecútalo en Supabase → SQL Editor → New query → Run.
-- Sin esta migración el server guarda el geo dentro de products como
-- "| @geo=lat,lng" y lo oculta al servirlo. Con ella, además usa columnas.

alter table public.profiles
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- Verificación rápida (debe devolver lat y lng en la lista de columnas):
-- select column_name from information_schema.columns
-- where table_schema = 'public' and table_name = 'profiles'
--   and column_name in ('lat', 'lng');
