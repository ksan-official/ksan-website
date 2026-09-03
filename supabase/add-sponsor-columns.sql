alter table public.about_entries
  add column if not exists sponsor_kind text not null default 'sponsor',
  add column if not exists benefits text,
  add column if not exists usage_guide text,
  add column if not exists cta_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'about_entries_sponsor_kind_check'
  ) then
    alter table public.about_entries
      add constraint about_entries_sponsor_kind_check
      check (sponsor_kind in ('sponsor', 'partner'));
  end if;
end
$$;
