import { NextResponse } from "next/server";

import {
  buildYouTubeAuthorizationUrl,
  createOAuthState,
  getStateCookieName,
} from "@/lib/youtube/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const state = createOAuthState();
    const response = NextResponse.redirect(buildYouTubeAuthorizationUrl(state));

    response.cookies.set(getStateCookieName(), state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start YouTube OAuth";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
