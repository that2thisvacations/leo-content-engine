import { NextResponse } from "next/server";

import { getLeoEpisodeBySlug } from "@/lib/leo/episodes";
import { generateLeoEpisodePlan } from "@/lib/openai/episode-plan";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const episode = await getLeoEpisodeBySlug(slug);

    if (!episode) {
      return NextResponse.json(
        { ok: false, error: `Episode not found: ${slug}` },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const plan = await generateLeoEpisodePlan(episode);

    return NextResponse.json(
      { ok: true, episode: { id: episode.id, slug: episode.slug, status: episode.status }, plan },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown episode planning error";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
