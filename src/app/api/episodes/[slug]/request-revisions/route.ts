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

    const body = (await request.json()) as { notes?: unknown };
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 4000) : "";
    if (notes.length < 5) return NextResponse.json({ ok: false, error: "Revision notes are required." }, { status: 400 });

    const result = await callLeoProductionFunction<Record<string, unknown>>({ action: "request_plan_revision", episodeId: episode.id, notes });
    return NextResponse.json({ ...result, approvalGate: "human", status: "changes_requested", nextStage: null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unable to request plan revisions." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
