import "server-only";

import { getServerEnvironment } from "@/lib/env/server";
import { signProductionPayload } from "@/lib/security/founder-session";

export async function callLeoProductionFunction<T>(payload: Record<string, unknown>): Promise<T> {
  const rawPayload = JSON.stringify(payload);
  const proof = signProductionPayload(rawPayload);
  const { supabase } = getServerEnvironment();

  const response = await fetch(`${supabase.url}/functions/v1/leo-production-write`, {
    method: "POST",
    headers: {
      apikey: supabase.publishableKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ payload: rawPayload, proof }),
    cache: "no-store",
  });

  const result = (await response.json()) as T & { ok?: boolean; error?: string };
  if (!response.ok || result.ok === false) {
    throw new Error(result.error ?? `LEO production function failed (${response.status}).`);
  }

  return result;
}
