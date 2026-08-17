import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getServerEnvironment } from "@/lib/env/server";

const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly";
const STATE_COOKIE = "leo_youtube_oauth_state";

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

type ChannelResponse = {
  items?: Array<{
    id?: string;
    snippet?: { title?: string; customUrl?: string };
  }>;
};

function youtubeConfig() {
  const { youtube } = getServerEnvironment();
  if (!youtube) {
    throw new Error("YouTube OAuth is not configured in the Vercel runtime.");
  }
  return youtube;
}

function stateSignature(nonce: string) {
  return createHmac("sha256", youtubeConfig().clientSecret).update(nonce).digest("hex");
}

export function createOAuthState() {
  const nonce = randomBytes(24).toString("hex");
  return `${nonce}.${stateSignature(nonce)}`;
}

export function verifyOAuthState(value: string) {
  const [nonce, signature] = value.split(".");
  if (!nonce || !signature) return false;

  const expected = stateSignature(nonce);
  if (signature.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function getStateCookieName() {
  return STATE_COOKIE;
}

export function buildYouTubeAuthorizationUrl(state: string) {
  const config = youtubeConfig();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", YOUTUBE_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "select_account consent");
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeAuthorizationCode(code: string): Promise<TokenResponse> {
  const config = youtubeConfig();
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`YouTube token exchange failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function getAuthorizedYouTubeChannel(accessToken: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("mine", "true");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`YouTube channel lookup failed (${response.status}): ${detail}`);
  }

  const result = (await response.json()) as ChannelResponse;
  const channel = result.items?.[0];

  if (!channel?.id) {
    const error = new Error(
      "The authorized Google identity does not own a YouTube channel that the YouTube Data API can use. Reconnect with the Google account that owns the channel. YouTube Studio delegated/channel-permission access does not grant YouTube API access.",
    );
    error.name = "YouTubeChannelOwnershipRequired";
    throw error;
  }

  return {
    id: channel.id,
    title: channel.snippet?.title ?? "YouTube Channel",
    handle: channel.snippet?.customUrl ?? null,
  };
}

export async function saveYouTubeConnection(input: {
  accessToken: string;
  refreshToken: string;
  scope?: string;
  tokenType?: string;
}) {
  const { supabase } = getServerEnvironment();
  const endpoint = `${supabase.url}/functions/v1/leo-youtube-connect`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: supabase.publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      scope: input.scope ?? null,
      tokenType: input.tokenType ?? null,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Saving YouTube connection failed (${response.status}): ${detail}`);
  }
}
