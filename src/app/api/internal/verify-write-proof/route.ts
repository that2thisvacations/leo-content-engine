import { NextResponse } from "next/server";

import { verifyProductionWriteProof } from "@/lib/security/founder-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { payload?: unknown; proof?: unknown };
    const payload = typeof body.payload === "string" ? body.payload : "";
    const proof = typeof body.proof === "string" ? body.proof : "";

    if (!payload || payload.length > 250_000 || !verifyProductionWriteProof(payload, proof)) {
      return NextResponse.json({ ok: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
