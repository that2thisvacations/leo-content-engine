import "server-only";

import { supabaseSelect } from "@/lib/supabase/rest";

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
  return supabaseSelect<LeoEpisode>("leo_episodes", {
    order: "episode_number.asc",
    limit,
  });
}

export async function getLeoEpisodeBySlug(slug: string): Promise<LeoEpisode | null> {
  const episodes = await supabaseSelect<LeoEpisode>("leo_episodes", {
    filters: { slug },
    limit: 1,
  });

  return episodes[0] ?? null;
}
