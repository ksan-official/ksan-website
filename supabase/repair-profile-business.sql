-- Run this once in the Supabase SQL editor for project fchahvzhlfhbjmjimvdr.
-- It brings older databases up to the current app schema without dropping data.

alter table public.profiles add column if not exists avatar_url text;

alter table public.business_posts add column if not exists department text;
alter table public.business_posts add column if not exists tags text[] not null default '{}';
alter table public.business_posts add column if not exists featured boolean not null default false;
alter table public.business_posts add column if not exists featured_order integer not null default 0;
alter table public.business_posts add column if not exists accent text not null default 'orange';
alter table public.business_posts add column if not exists company_intro text;
alter table public.business_posts add column if not exists responsibilities text;
alter table public.business_posts add column if not exists requirements text;

create index if not exists business_posts_public_order_idx
  on public.business_posts (published, featured desc, featured_order asc, created_at desc);

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('about-images', 'about-images', true)
on conflict (id) do update set public = excluded.public;

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

insert into public.saved_business_items (user_id, job_id, created_at)
select user_id, business_post_id::text, created_at
from public.saved_business_posts
on conflict (user_id, job_id) do nothing;

alter table public.saved_business_posts enable row level security;
alter table public.saved_business_items enable row level security;

drop policy if exists "Users manage saved business posts" on public.saved_business_posts;
create policy "Users manage saved business posts" on public.saved_business_posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage saved business items" on public.saved_business_items;
create policy "Users manage saved business items" on public.saved_business_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can view profile photos" on storage.objects;
create policy "Users can view profile photos" on storage.objects
  for select using (bucket_id = 'profile-photos');

drop policy if exists "Users can upload their own profile photos" on storage.objects;
create policy "Users can upload their own profile photos" on storage.objects
  for insert with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own profile photos" on storage.objects;
create policy "Users can update their own profile photos" on storage.objects
  for update using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own profile photos" on storage.objects;
create policy "Users can delete their own profile photos" on storage.objects
  for delete using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anyone can view about images" on storage.objects;
create policy "Anyone can view about images" on storage.objects
  for select using (bucket_id = 'about-images');

drop policy if exists "Admins can upload about images" on storage.objects;
create policy "Admins can upload about images" on storage.objects
  for insert with check (
    bucket_id = 'about-images'
    and public.is_admin()
  );

drop policy if exists "Admins can update about images" on storage.objects;
create policy "Admins can update about images" on storage.objects
  for update using (
    bucket_id = 'about-images'
    and public.is_admin()
  ) with check (
    bucket_id = 'about-images'
    and public.is_admin()
  );

drop policy if exists "Admins can delete about images" on storage.objects;
create policy "Admins can delete about images" on storage.objects
  for delete using (
    bucket_id = 'about-images'
    and public.is_admin()
  );

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
    case
      when (new.raw_user_meta_data ->> 'admission_year') ~ '^[0-9]{4}$'
        then (new.raw_user_meta_data ->> 'admission_year')::integer
      else null
    end
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    school = coalesce(public.profiles.school, excluded.school),
    major = coalesce(public.profiles.major, excluded.major),
    admission_year = coalesce(public.profiles.admission_year, excluded.admission_year),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
