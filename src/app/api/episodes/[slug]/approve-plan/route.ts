import { NextResponse } from "next/server";

import { getLeoEpisodeBySlug } from "@/lib/leo/episodes";
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
    const episode = await getLeoEpisodeBySlug(slug);
    if (!episode) {
      return NextResponse.json({ ok: false, error: `Episode not found: ${slug}` }, { status: 404 });
    }

    let notes: string | undefined;
    try {
      const body = (await request.json()) as { notes?: unknown };
      if (typeof body.notes === "string") notes = body.notes;
    } catch {
      notes = undefined;
    }

    const result = await callLeoProductionFunction<Record<string, unknown>>({
      action: "approve_plan",
      episodeId: episode.id,
      notes: notes ?? null,
    });

    return NextResponse.json(
      { ...result, approvalGate: "human", nextStage: "storyboard_ready" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to approve episode plan." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
