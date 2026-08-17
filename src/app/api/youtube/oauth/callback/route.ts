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

    await getAuthorizedYouTubeChannel(tokens.access_token);
    await saveYouTubeConnection({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope,
      tokenType: tokens.token_type,
    });

    const response = NextResponse.redirect(new URL("/?youtube=connected", request.url));
    response.cookies.delete(getStateCookieName());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube OAuth callback failed";

    if (error instanceof Error && error.name === "YouTubeChannelOwnershipRequired") {
      const response = NextResponse.json(
        {
          ok: false,
          code: "YOUTUBE_CHANNEL_OWNER_REQUIRED",
          error: message,
          fix: [
            "Use the Google account that OWNS the YouTube channel, not an account invited through YouTube Studio Permissions.",
            "If the owner account manages multiple YouTube/Brand channels, make the target channel the default channel in YouTube before reconnecting.",
            "Then reconnect. The LEO OAuth flow now forces Google to show the account chooser instead of silently reusing the previous identity.",
          ],
          reconnect: "https://leo-content-engine.vercel.app/api/youtube/oauth/connect",
        },
        { status: 409 },
      );
      response.cookies.delete(getStateCookieName());
      return response;
    }

    const response = NextResponse.json({ ok: false, error: message }, { status: 503 });
    response.cookies.delete(getStateCookieName());
    return response;
  }
}
