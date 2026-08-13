import "server-only";

import { supabaseRpc } from "@/lib/supabase/rest";

export type LeoEpisode = {
  id: string;
  destination_id: string;
  episode_number: number;
  slug: string;
  title: string;
  working_title: string | null;
  status: string;
  learning_pillars: string[];
  synopsis: string | null;
  youtube_title: string | null;
  youtube_video_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listLeoEpisodes(limit = 25): Promise<LeoEpisode[]> {
  const episodes = await supabaseRpc<LeoEpisode[]>("leo_list_episodes");
  return episodes.slice(0, Math.max(0, limit));
}

export async function getLeoEpisodeBySlug(slug: string): Promise<LeoEpisode | null> {
  const episodes = await supabaseRpc<LeoEpisode[]>("leo_get_episode", { p_slug: slug });
  return episodes[0] ?? null;
}
