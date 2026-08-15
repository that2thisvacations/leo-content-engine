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
    snippet?: { title?: string };
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
  url.searchParams.set("prompt", "consent");
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
    throw new Error("No YouTube channel was found for the authorized Google account.");
  }

  return {
    id: channel.id,
    title: channel.snippet?.title ?? "YouTube Channel",
  };
}

export async function saveYouTubeConnection(input: {
  refreshToken: string;
  scope?: string;
  tokenType?: string;
  channelId: string;
  channelTitle: string;
}) {
  const { supabase } = getServerEnvironment();

  if (!supabase.serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to store the YouTube refresh token securely.");
  }

  const response = await fetch(`${supabase.url}/rest/v1/leo_youtube_connections?on_conflict=provider`, {
    method: "POST",
    headers: {
      apikey: supabase.serviceRoleKey,
      Authorization: `Bearer ${supabase.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      provider: "youtube",
      channel_id: input.channelId,
      channel_title: input.channelTitle,
      refresh_token: input.refreshToken,
      scope: input.scope ?? null,
      token_type: input.tokenType ?? null,
      connected_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Saving YouTube connection failed (${response.status}): ${detail}`);
  }
}
