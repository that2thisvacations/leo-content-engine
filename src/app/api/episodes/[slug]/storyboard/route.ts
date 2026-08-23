import { NextResponse } from "next/server";

import { getFounderEpisodeBySlug } from "@/lib/leo/episodes";
import { callLeoProductionFunction } from "@/lib/leo/production-write";
import { hasFounderSession } from "@/lib/security/founder-session";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!hasFounderSession(request)) {
    return NextResponse.json({ ok: false, error: "Founder authorization required." }, { status: 401 });
  }

  try {
    const { slug } = await context.params;
    const episode = await getFounderEpisodeBySlug(slug);
    if (!episode) return NextResponse.json({ ok: false, error: `Episode not found: ${slug}` }, { status: 404 });

    const result = await callLeoProductionFunction<Record<string, unknown>>({ action: "build_storyboard", episodeId: episode.id });
    return NextResponse.json({ ...result, nextStage: "storyboard_review_required", mediaStarted: false, publishingStarted: false }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to build storyboard." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
