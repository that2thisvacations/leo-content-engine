-- Leo episode production queue. Apply only after reviewing project migrations.
create table if not exists public.leo_episode_jobs (
  id uuid primary key,
  episode_id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  state text not null default 'queued' check (state in ('queued','planning','rendering','assembling','review','approved','failed','cancelled','published')),
  request jsonb not null,
  draft_asset_path text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leo_episode_jobs_episode_id_length check (char_length(episode_id) between 3 and 100)
);
create index if not exists leo_episode_jobs_owner_created on public.leo_episode_jobs(owner_id,created_at desc);
alter table public.leo_episode_jobs enable row level security;
drop policy if exists leo_episode_jobs_read_own on public.leo_episode_jobs;
create policy leo_episode_jobs_read_own on public.leo_episode_jobs for select to authenticated using (owner_id = (select auth.uid()));
-- Deliberately no client insert/update/delete policies. Server-side job creation must
-- verify caller identity, credit reservation, idempotency and approval controls.
create table if not exists public.leo_episode_job_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.leo_episode_jobs(id) on delete cascade,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists leo_episode_events_job_created on public.leo_episode_job_events(job_id,created_at);
alter table public.leo_episode_job_events enable row level security;
drop policy if exists leo_episode_events_read_own on public.leo_episode_job_events;
create policy leo_episode_events_read_own on public.leo_episode_job_events for select to authenticated using (
 exists (select 1 from public.leo_episode_jobs j where j.id=job_id and j.owner_id=(select auth.uid()))
);
-- Service-role processing writes state changes. Publishing is blocked until explicit
-- owner approval is recorded by a separately authenticated approval endpoint.
