create table if not exists public.leo_episode_plans (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null unique references public.leo_episodes(id) on delete cascade,
  plan jsonb not null,
  status text not null default 'review_required' check (status in ('generated','review_required','approved','rejected')),
  generated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  approved_at timestamptz,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leo_episode_plans_status_idx on public.leo_episode_plans(status);
alter table public.leo_episode_plans enable row level security;

create trigger leo_episode_plans_set_updated_at
before update on public.leo_episode_plans
for each row execute function public.leo_set_updated_at();
