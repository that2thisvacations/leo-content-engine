import { NextResponse } from "next/server";

import { getLeoEpisodeBySlug } from "@/lib/leo/episodes";
import { callLeoProductionFunction } from "@/lib/leo/production-write";
import { generateLeoEpisodePlan } from "@/lib/openai/episode-plan";
import { hasFounderSession } from "@/lib/security/founder-session";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  if (!hasFounderSession(request)) {
    return NextResponse.json(
      { ok: false, error: "Founder authorization required. Reconnect the LEO YouTube channel." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

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
    const persistence = await callLeoProductionFunction<{
      ok: true;
      action: string;
      sceneCount: number;
    }>({ action: "persist_plan", episodeId: episode.id, plan });

    return NextResponse.json(
      {
        ok: true,
        episode: { id: episode.id, slug: episode.slug, status: "storyboarding" },
        plan,
        persisted: true,
        sceneCount: persistence.sceneCount,
        approvalRequired: true,
      },
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
