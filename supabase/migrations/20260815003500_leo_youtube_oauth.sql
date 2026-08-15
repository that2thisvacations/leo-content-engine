create table if not exists public.leo_youtube_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'youtube' check (provider = 'youtube'),
  channel_id text,
  channel_title text,
  refresh_token text not null,
  scope text,
  token_type text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider)
);

alter table public.leo_youtube_connections enable row level security;
revoke all on table public.leo_youtube_connections from anon, authenticated;
grant all on table public.leo_youtube_connections to service_role;

create or replace function public.leo_touch_youtube_connection()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leo_youtube_connections_touch on public.leo_youtube_connections;
create trigger leo_youtube_connections_touch
before update on public.leo_youtube_connections
for each row execute function public.leo_touch_youtube_connection();
