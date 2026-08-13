import { NextResponse } from "next/server";

import { listLeoEpisodes } from "@/lib/leo/episodes";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const episodes = await listLeoEpisodes();

    return NextResponse.json(
      { ok: true, count: episodes.length, episodes },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown episode API error";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
