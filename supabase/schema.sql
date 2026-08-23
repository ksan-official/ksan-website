create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  school text,
  major text,
  admission_year integer,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.allowed_email_domains (
  domain text primary key,
  enabled boolean not null default true
);

create table if not exists public.guide_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default '정착가이드',
  summary text,
  author text,
  notion_url text,
  tags text[] not null default '{}',
  raw_text text not null default '',
  blocks jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text,
  employment_type text,
  department text,
  tags text[] not null default '{}',
  deadline date,
  apply_mode text not null default 'email' check (apply_mode in ('email', 'external_link', 'internal_form')),
  apply_target text not null,
  description text not null,
  featured boolean not null default false,
  featured_order integer not null default 0,
  accent text not null default 'orange' check (accent in ('orange', 'blue', 'dark')),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing Supabase projects need additive columns because CREATE TABLE IF NOT EXISTS
-- does not update a table that was created with an earlier schema version.
alter table public.business_posts add column if not exists department text;
alter table public.business_posts add column if not exists tags text[] not null default '{}';
alter table public.business_posts add column if not exists featured boolean not null default false;
alter table public.business_posts add column if not exists featured_order integer not null default 0;
alter table public.business_posts add column if not exists accent text not null default 'orange';
alter table public.guide_posts add column if not exists notion_url text;
alter table public.guide_posts alter column raw_text set default '';
create index if not exists business_posts_public_order_idx
  on public.business_posts (published, featured desc, featured_order asc, created_at desc);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  location text,
  description text not null,
  registration_mode text not null default 'internal_form' check (registration_mode in ('google_form', 'external_link', 'internal_form')),
  registration_target text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  application_type text not null check (application_type in ('business_application', 'event_registration')),
  target_id text not null,
  full_name text not null,
  email text not null,
  school text,
  major text,
  admission_year text,
  message text,
  submitted_at timestamptz not null default now(),
  sheets_sync_status text not null default 'pending' check (sheets_sync_status in ('pending', 'synced', 'failed', 'skipped')),
  sheets_sync_error text
);

create table if not exists public.saved_guides (
  user_id uuid references auth.users(id) on delete cascade,
  guide_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, guide_slug)
);

create table if not exists public.saved_business_posts (
  user_id uuid references auth.users(id) on delete cascade,
  business_post_id uuid references public.business_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, business_post_id)
);

create table if not exists public.saved_business_items (
  user_id uuid references auth.users(id) on delete cascade,
  job_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table if not exists public.about_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('executive', 'president', 'team_member', 'sponsor')),
  title text not null,
  subtitle text,
  body text,
  image_url text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, school, major, admission_year)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'school',
    new.raw_user_meta_data ->> 'major',
    nullif(new.raw_user_meta_data ->> 'admission_year', '')::integer
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.allowed_email_domains enable row level security;
alter table public.guide_posts enable row level security;
alter table public.business_posts enable row level security;
alter table public.events enable row level security;
alter table public.applications enable row level security;
alter table public.saved_guides enable row level security;
alter table public.saved_business_posts enable row level security;
alter table public.saved_business_items enable row level security;
alter table public.about_entries enable row level security;
alter table public.map_spots enable row level security;

create policy "Users can read their own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Admins can manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Published guide posts are public" on public.guide_posts
  for select using (published = true or public.is_admin());

create policy "Admins manage guide posts" on public.guide_posts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Published business posts are public" on public.business_posts
  for select using (published = true or public.is_admin());

create policy "Admins manage business posts" on public.business_posts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Published events are public" on public.events
  for select using (published = true or public.is_admin());

create policy "Admins manage events" on public.events
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Users read own applications" on public.applications
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Admins manage applications" on public.applications
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Users manage saved guides" on public.saved_guides
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage saved business posts" on public.saved_business_posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage saved business items" on public.saved_business_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Published about entries are public" on public.about_entries
  for select using (published = true or public.is_admin());

create policy "Admins manage about entries" on public.about_entries
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Published map spots are public" on public.map_spots
  for select using (published = true or public.is_admin());

create policy "Admins manage map spots" on public.map_spots
  for all using (public.is_admin()) with check (public.is_admin());
