import { NextRequest, NextResponse } from "next/server";

import {
  exchangeAuthorizationCode,
  getAuthorizedYouTubeChannel,
  getStateCookieName,
  saveYouTubeConnection,
  verifyOAuthState,
} from "@/lib/youtube/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  const storedState = request.cookies.get(getStateCookieName())?.value;

  if (oauthError) {
    return NextResponse.json({ ok: false, error: `Google authorization failed: ${oauthError}` }, { status: 400 });
  }

  if (!code || !state || !storedState || state !== storedState || !verifyOAuthState(state)) {
    return NextResponse.json({ ok: false, error: "Invalid or expired YouTube OAuth state." }, { status: 400 });
  }

  try {
    const tokens = await exchangeAuthorizationCode(code);

    if (!tokens.refresh_token) {
      throw new Error("Google did not return a refresh token. Reconnect and approve access again.");
    }

    const channel = await getAuthorizedYouTubeChannel(tokens.access_token);
    await saveYouTubeConnection({
      refreshToken: tokens.refresh_token,
      scope: tokens.scope,
      tokenType: tokens.token_type,
      channelId: channel.id,
      channelTitle: channel.title,
    });

    const response = NextResponse.redirect(new URL("/?youtube=connected", request.url));
    response.cookies.delete(getStateCookieName());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube OAuth callback failed";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
