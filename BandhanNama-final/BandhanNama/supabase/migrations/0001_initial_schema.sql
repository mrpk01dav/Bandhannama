-- BandhanNama initial schema. Apply in Supabase SQL Editor or via Supabase CLI.
-- Private sister data is never readable by anon/authenticated roles.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.normalize_sister_name(input text)
returns text
language sql immutable parallel safe
as $$ select lower(regexp_replace(normalize(trim(coalesce(input, '')), NFKC), '\s+', ' ', 'g')); $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.sisters (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 80),
  normalized_name text generated always as (public.normalize_sister_name(display_name)) stored,
  pin_hash text not null,
  personal_wish text not null check (char_length(personal_wish) between 1 and 4000),
  memory_text text,
  photo_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sisters_normalized_name_unique unique (normalized_name)
);
create index if not exists sisters_active_name_idx on public.sisters (normalized_name) where is_active = true;

create table if not exists public.public_name_suggestions (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 80),
  normalized_name text generated always as (public.normalize_sister_name(display_name)) stored,
  sister_id uuid references public.sisters(id) on delete set null,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint public_name_suggestions_name_unique unique (normalized_name)
);
create index if not exists public_name_suggestions_visible_idx on public.public_name_suggestions (sort_order, display_name) where is_visible = true;

create table if not exists public.site_settings (
  setting_key text primary key,
  setting_value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

drop trigger if exists sisters_set_updated_at on public.sisters;
create trigger sisters_set_updated_at before update on public.sisters
for each row execute function public.set_updated_at();
drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- No direct table access for public visitors. Server-only service role handles
-- the public wish lookup after validation/rate limiting and admin authorization.
alter table public.sisters enable row level security;
alter table public.public_name_suggestions enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.sisters from anon, authenticated;
revoke all on public.public_name_suggestions from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;
revoke all on public.admin_profiles from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;
grant all on public.sisters to service_role;
grant all on public.public_name_suggestions to service_role;
grant all on public.site_settings to service_role;
grant all on public.admin_profiles to service_role;
grant all on public.audit_logs to service_role;

-- Admin reads are intentionally not granted here. Stage 5 will add narrow
-- policies based on admin_profiles and verified Supabase Auth sessions.

insert into public.site_settings (setting_key, setting_value)
values
 ('common_wish', to_jsonb('Dear [Name], This little surprise is for you. May your life always remain filled with happiness, beautiful memories, success and endless reasons to smile. Your brother is always cheering for you. Happy Bhai Dooj! ❤️'::text)),
 ('brother_message', to_jsonb('No matter where life takes us, no matter how much time passes, the bond we share will always remain special. You will always have a brother cheering for you. Happy Bhai Dooj! ❤️'::text)),
 ('brother_display_name', to_jsonb('Your Brother'::text))
on conflict (setting_key) do nothing;
