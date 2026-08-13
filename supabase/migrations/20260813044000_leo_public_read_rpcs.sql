create or replace function public.leo_list_episodes()
returns table (
  id uuid,
  destination_id uuid,
  episode_number integer,
  slug text,
  title text,
  working_title text,
  status text,
  learning_pillars text[],
  synopsis text,
  youtube_title text,
  youtube_video_id text,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.destination_id,
    e.episode_number,
    e.slug,
    e.title,
    e.working_title,
    e.status,
    e.learning_pillars,
    e.synopsis,
    e.youtube_title,
    e.youtube_video_id,
    e.published_at,
    e.created_at,
    e.updated_at
  from public.leo_episodes e
  order by e.episode_number asc;
$$;

create or replace function public.leo_get_episode(p_slug text)
returns table (
  id uuid,
  destination_id uuid,
  episode_number integer,
  slug text,
  title text,
  working_title text,
  status text,
  learning_pillars text[],
  synopsis text,
  youtube_title text,
  youtube_video_id text,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.destination_id,
    e.episode_number,
    e.slug,
    e.title,
    e.working_title,
    e.status,
    e.learning_pillars,
    e.synopsis,
    e.youtube_title,
    e.youtube_video_id,
    e.published_at,
    e.created_at,
    e.updated_at
  from public.leo_episodes e
  where e.slug = p_slug
  limit 1;
$$;

revoke all on function public.leo_list_episodes() from public;
revoke all on function public.leo_get_episode(text) from public;
grant execute on function public.leo_list_episodes() to anon, authenticated;
grant execute on function public.leo_get_episode(text) to anon, authenticated;
