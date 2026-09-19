import { NextResponse } from "next/server";

import { getFounderEpisodeBySlug } from "@/lib/leo/episodes";
import { hasFounderSession } from "@/lib/security/founder-session";
import { submitRunPodVideo } from "@/lib/providers/runpod";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!hasFounderSession(request)) {
    return NextResponse.json({ ok: false, error: "Founder authorization required." }, { status: 401 });
  }
  const { slug } = await context.params;
  const episode = await getFounderEpisodeBySlug(slug);
  if (!episode) return NextResponse.json({ ok: false, error: `Episode not found: ${slug}` }, { status: 404 });

  const body = (await request.json()) as { image?: string; prompt?: string; negativePrompt?: string; seed?: number };
  if (!body.image || !body.prompt) {
    return NextResponse.json({ ok: false, error: "image and prompt are required." }, { status: 400 });
  }

  try {
    const job = await submitRunPodVideo({
      image: body.image,
      prompt: body.prompt,
      negativePrompt: body.negativePrompt,
      seed: body.seed,
    });
    return NextResponse.json({ ok: true, episodeId: episode.id, ...job }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Render submission failed." }, { status: 503 });
  }
}
