import { NextResponse } from "next/server";

import { getFounderEpisodeBySlug } from "@/lib/leo/episodes";
import { callLeoProductionFunction } from "@/lib/leo/production-write";
import { hasFounderSession } from "@/lib/security/founder-session";
import { submitRunPodVideo } from "@/lib/providers/runpod";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ slug: string }> };

type ProductionState = {
  ok?: boolean;
  episode?: { status?: string } | null;
  plan?: { status?: string } | null;
};

export async function POST(request: Request, context: RouteContext) {
  if (!hasFounderSession(request)) {
    return NextResponse.json({ ok: false, error: "Founder authorization required." }, { status: 401 });
  }

  // Explicitly opt in only after persistent approval and spend-limit controls exist.
  // In particular, a storyboard_review_required episode MUST NOT be renderable.
  if (process.env.LEO_PROOF_RENDER_ENABLED !== "true") {
    return NextResponse.json(
      { ok: false, error: "LEO rendering is locked pending production approval and cost controls." },
      { status: 423, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const { slug } = await context.params;
    const episode = await getFounderEpisodeBySlug(slug);
    if (!episode) return NextResponse.json({ ok: false, error: "Episode not found." }, { status: 404 });

    const production = await callLeoProductionFunction<ProductionState>({
      action: "get_production",
      episodeId: episode.id,
    });

    // Plan approval only unlocks storyboarding. Explicit storyboard/render
    // approval must be persisted server-side before this route can submit a job.
    if (
      production.ok !== true ||
      production.plan?.status !== "approved" ||
      production.episode?.status !== "render_approved"
    ) {
      return NextResponse.json(
        { ok: false, error: "Explicit storyboard and rendering approval required." },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    const body = (await request.json()) as {
      image?: unknown;
      prompt?: unknown;
      negativePrompt?: unknown;
      seed?: unknown;
    };
    if (
      typeof body.image !== "string" ||
      body.image.length < 1 ||
      body.image.length > 2000000 ||
      typeof body.prompt !== "string" ||
      body.prompt.trim().length < 1 ||
      body.prompt.length > 6000 ||
      (body.negativePrompt !== undefined && (typeof body.negativePrompt !== "string" || body.negativePrompt.length > 3000)) ||
      (body.seed !== undefined && (!Number.isSafeInteger(body.seed) || (body.seed as number) < 0))
    ) {
      return NextResponse.json({ ok: false, error: "Invalid render request." }, { status: 400 });
    }

    const job = await submitRunPodVideo({
      image: body.image,
      prompt: body.prompt,
      negativePrompt: body.negativePrompt as string | undefined,
      seed: body.seed as number | undefined,
    });
    return NextResponse.json({ ok: true, episodeId: episode.id, ...job }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to verify production authorization or submit render." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
