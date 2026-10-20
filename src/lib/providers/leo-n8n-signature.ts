import { createHmac, timingSafeEqual } from "node:crypto";

export type SignedLeoWebhook = {
  version: 1;
  jobId: string;
  type: "leo-episode";
  payload: unknown;
  creativeDirection: unknown;
};

export function verifyLeoWebhook(rawBody: string, headers: Headers, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): SignedLeoWebhook {
  if (!secret || secret.length < 32) throw new Error("Webhook signing secret is missing or too short");
  const timestamp = headers.get("x-leo-timestamp") ?? "";
  const signature = headers.get("x-leo-signature") ?? "";
  const idempotencyKey = headers.get("x-leo-idempotency-key") ?? "";
  if (!/^\d{10}$/.test(timestamp) || Math.abs(nowSeconds - Number(timestamp)) > 300) throw new Error("Webhook timestamp invalid or expired");
  if (!/^[a-f0-9]{64}$/i.test(signature)) throw new Error("Webhook signature invalid");
  const expected = createHmac("sha256", secret).update(timestamp + "." + rawBody).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) throw new Error("Webhook signature mismatch");
  const parsed: unknown = JSON.parse(rawBody);
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid webhook payload");
  const data = parsed as Record<string, unknown>;
  if (data.version !== 1 || data.type !== "leo-episode" || typeof data.jobId !== "string" || data.jobId !== idempotencyKey) {
    throw new Error("Webhook job identity mismatch");
  }
  if (!/^[0-9a-f-]{36}$/i.test(data.jobId)) throw new Error("Invalid job ID");
  return data as SignedLeoWebhook;
}

/** Receiver must call a durable database INSERT with a UNIQUE jobId constraint
 * before acknowledging; this function verifies authenticity, not replay storage.
 */
