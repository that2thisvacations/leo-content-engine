import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getServerEnvironment } from "@/lib/env/server";

const FOUNDER_SESSION_COOKIE = "leo_founder_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  const { youtube } = getServerEnvironment();
  if (!youtube?.clientSecret) {
    throw new Error("YouTube OAuth secret is required for founder session signing.");
  }
  return youtube.clientSecret;
}

function hmac(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export function getFounderSessionCookieName() {
  return FOUNDER_SESSION_COOKIE;
}

export function getFounderSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function createFounderSessionToken() {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + SESSION_TTL_SECONDS;
  const payload = `v1.${issuedAt}.${expiresAt}`;
  const signature = hmac(`session:${payload}`);
  return `${payload}.${signature}`;
}

export function verifyFounderSessionToken(value: string | undefined) {
  if (!value) return false;
  const [version, issuedAtText, expiresAtText, signature] = value.split(".");
  if (version !== "v1" || !issuedAtText || !expiresAtText || !signature) return false;

  const issuedAt = Number(issuedAtText);
  const expiresAt = Number(expiresAtText);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || issuedAt > now + 60 || expiresAt <= now) return false;

  const payload = `${version}.${issuedAtText}.${expiresAtText}`;
  return safeEqual(signature, hmac(`session:${payload}`));
}

export function getFounderSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const prefix = `${FOUNDER_SESSION_COOKIE}=`;
  const value = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
  return value ? decodeURIComponent(value) : undefined;
}

export function hasFounderSession(request: Request) {
  return verifyFounderSessionToken(getFounderSessionFromRequest(request));
}

export function signProductionPayload(payload: string) {
  return hmac(`write:${payload}`);
}

export function verifyProductionWriteProof(payload: string, proof: string) {
  if (!payload || !proof) return false;
  return safeEqual(proof, signProductionPayload(payload));
}
