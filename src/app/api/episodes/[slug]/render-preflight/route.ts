import { NextResponse } from "next/server";

import { getFounderEpisodeBySlug } from "@/lib/leo/episodes";
import { callLeoProductionFunction } from "@/lib/leo/production-write";
import { hasFounderSession } from "@/lib/security/founder-session";
import { getServerEnvironment } from "@/lib/env/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };
type ProductionState = {
  ok?: boolean;
  episode?: { status?: string } | null;
  plan?: { status?: string } | null;
  scenes?: Array<{ id?: string; status?: string }>;
  reviews?: Array<{ review_type?: string; status?: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  if (!hasFounderSession(request)) {
    return NextResponse.json({ ok: false, error: "Founder authorization required." }, { status: 401 });
  }

  try {
    const { slug } = await context.params;
    const episode = await getFounderEpisodeBySlug(slug);
    if (!episode) return NextResponse.json({ ok: false, error: "Episode not found." }, { status: 404 });

    const production = await callLeoProductionFunction<ProductionState>({
      action: "get_production",
      episodeId: episode.id,
    });
    const runpodConfigured = Boolean(getServerEnvironment().runpod);
    const blocks: string[] = [];
    if (production.ok !== true) blocks.push("Production state not verified");
    if (production.plan?.status !== "approved") blocks.push("Episode plan not approved");
    if (production.episode?.status !== "render_approved") blocks.push("Storyboard/render approval not persisted");
    if (!production.scenes?.length) blocks.push("Persisted scenes unavailable");
    if (!runpodConfigured) blocks.push("Dedicated LEO RunPod credentials not configured");
    if (process.env.LEO_PROOF_RENDER_ENABLED !== "true") blocks.push("Proof-render opt-in is disabled");

    // Cost accounting and idempotent job reservations have not yet been wired
    // to RunPod. Report this explicitly even if all other conditions pass.
    blocks.push("Atomic spend reservation and idempotent render queue not implemented");

    return NextResponse.json({
      ok: true,
      episode: { id: episode.id, slug: episode.slug, status: production.episode?.status ?? episode.status },
      planStatus: production.plan?.status ?? null,
      sceneCount: production.scenes?.length ?? 0,
      reviewStatuses: (production.reviews ?? []).map((review) => ({
        type: review.review_type ?? "unknown",
        status: review.status ?? "unknown",
      })),
      renderReady: false,
      blockers: blocks,
      nextAction: "Implement audited, durable per-scene authorization and atomic spend reservation before enabling paid render.",
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json(
      { ok: false, renderReady: false, error: "Unable to verify LEO production preflight." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
