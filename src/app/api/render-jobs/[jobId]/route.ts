import { NextResponse } from "next/server";

import { getRunPodJob } from "@/lib/providers/runpod";
import { hasFounderSession } from "@/lib/security/founder-session";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, context: RouteContext) {
  if (!hasFounderSession(request)) {
    return NextResponse.json({ ok: false, error: "Founder authorization required." }, { status: 401 });
  }

  const { jobId } = await context.params;
  if (!jobId) return NextResponse.json({ ok: false, error: "jobId is required." }, { status: 400 });

  try {
    const job = await getRunPodJob(jobId);
    return NextResponse.json({ ok: true, job }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to load render job." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
