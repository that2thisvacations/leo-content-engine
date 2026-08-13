-- LEO Content Engine Phase 2 schema.
-- Applied to the shared travelbuddy-content-engine Supabase project with leo_* namespacing.

create extension if not exists pgcrypto;

create or replace function public.leo_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.leo_destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  country_code text not null,
  country_name text not null,
  primary_city text,
  title text not null,
  summary text,
  local_currency_code text,
  local_currency_name text,
  timezone text,
  status text not null default 'research_ready' check (status in ('idea','researching','research_ready','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leo_episodes (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.leo_destinations(id) on delete restrict,
  episode_number integer not null unique,
  slug text not null unique,
  title text not null,
  working_title text,
  target_age_min integer not null default 6,
  target_age_max integer not null default 10,
  status text not null default 'idea' check (status in ('idea','researching','research_ready','scripting','script_ready','storyboarding','storyboard_ready','generating','assembling','review_required','approved','publishing','published','repurposing','complete','failed')),
  learning_pillars text[] not null default '{}',
  signature_close text not null default 'How would YOU like to visit and see it for yourself?',
  script_markdown text,
  synopsis text,
  youtube_title text,
  youtube_description text,
  youtube_video_id text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leo_episode_sources (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.leo_episodes(id) on delete cascade,
  source_type text not null default 'web',
  title text not null,
  url text,
  publisher text,
  fact_scope text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.leo_money_moments (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null unique references public.leo_episodes(id) on delete cascade,
  item_name text not null,
  local_amount numeric(12,2) not null,
  local_currency_code text not null,
  usd_amount numeric(12,2),
  fx_rate numeric(18,8),
  fx_source text,
  fx_captured_at timestamptz,
  disclaimer text not null default 'Approximate exchange rate — rates change.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leo_scenes (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.leo_episodes(id) on delete cascade,
  scene_number integer not null,
  title text not null,
  purpose text,
  location text,
  narration text,
  dialogue jsonb not null default '[]'::jsonb,
  visual_prompt text,
  wardrobe_prompt text,
  duration_seconds numeric(6,2),
  status text not null default 'planned' check (status in ('planned','prompt_ready','generating','generated','approved','rejected','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, scene_number)
);

create table if not exists public.leo_assets (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid references public.leo_episodes(id) on delete cascade,
  scene_id uuid references public.leo_scenes(id) on delete cascade,
  asset_type text not null check (asset_type in ('image','video','audio','voice','music','caption','thumbnail','final_video','short','document')),
  provider text,
  provider_job_id text,
  storage_url text,
  mime_type text,
  duration_seconds numeric(8,2),
  cost_usd numeric(10,4),
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','generating','ready','approved','rejected','failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.leo_production_jobs (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.leo_episodes(id) on delete cascade,
  scene_id uuid references public.leo_scenes(id) on delete cascade,
  job_type text not null,
  provider text,
  status text not null default 'queued' check (status in ('queued','running','waiting','succeeded','failed','cancelled')),
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error_message text,
  retry_count integer not null default 0,
  cost_usd numeric(10,4),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.leo_reviews (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.leo_episodes(id) on delete cascade,
  review_type text not null check (review_type in ('facts','culture','safety','character','producer')),
  status text not null default 'pending' check (status in ('pending','passed','changes_required','rejected')),
  notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (episode_id, review_type)
);

create index if not exists leo_episodes_destination_idx on public.leo_episodes(destination_id);
create index if not exists leo_episodes_status_idx on public.leo_episodes(status);
create index if not exists leo_scenes_episode_idx on public.leo_scenes(episode_id, scene_number);
create index if not exists leo_jobs_episode_status_idx on public.leo_production_jobs(episode_id, status);
create index if not exists leo_assets_episode_idx on public.leo_assets(episode_id);

alter table public.leo_destinations enable row level security;
alter table public.leo_episodes enable row level security;
alter table public.leo_episode_sources enable row level security;
alter table public.leo_money_moments enable row level security;
alter table public.leo_scenes enable row level security;
alter table public.leo_assets enable row level security;
alter table public.leo_production_jobs enable row level security;
alter table public.leo_reviews enable row level security;

insert into public.leo_destinations (slug,country_code,country_name,primary_city,title,summary,local_currency_code,local_currency_name,timezone,status)
values ('japan','JP','Japan','Tokyo','LEO Explores Japan','Tokyo, Kyoto, Mount Fuji, food, language, trains, culture and family travel inspiration.','JPY','Japanese yen','Asia/Tokyo','research_ready')
on conflict (slug) do update set updated_at = now();

insert into public.leo_episodes (destination_id,episode_number,slug,title,working_title,status,learning_pillars,synopsis)
select id,1,'japan-001','LEO’s First Big Adventure: Japan','LEO Discovers Japan','research_ready',array['Countries & Places','Cultures & Traditions','Food Adventures','Languages Around the World','Activities & Experiences','Money & Entrepreneurship'],
'LEO follows a mysterious train ticket to Japan, discovers Tokyo and Kyoto, rides the Shinkansen, learns a greeting, explores food and etiquette, sees Mount Fuji, and completes his first Money Moment in Japanese yen.'
from public.leo_destinations where slug='japan'
on conflict (episode_number) do update set updated_at=now();
