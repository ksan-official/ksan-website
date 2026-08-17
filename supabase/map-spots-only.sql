create table if not exists public.map_spots (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('cafe', 'food', 'study')),
  city text,
  description text,
  address text,
  neighborhood text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  google_maps_url text,
  source_list_url text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.map_spots add column if not exists city text;

alter table public.map_spots enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'map_spots'
      and policyname = 'Published map spots are public'
  ) then
    create policy "Published map spots are public" on public.map_spots
      for select
      using (published = true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'map_spots'
      and policyname = 'Admins manage map spots'
  ) then
    create policy "Admins manage map spots" on public.map_spots
      for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end
$$;
