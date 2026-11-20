-- Ejecuta este script en Supabase: SQL Editor → New query
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('tiendita', 'proveedor')),
  business_name text not null,
  responsible_name text not null,
  email text not null unique,
  phone text not null,
  address text not null,
  schedule text default '',
  zone text default '',
  category text default '',
  products text default '',
  capacity text default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "Users read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Permite que la API con service_role cree perfiles desde el servidor.
-- No otorgues service_role al navegador.
