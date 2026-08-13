import "server-only";

import { getServerEnvironment } from "@/lib/env/server";

type QueryOptions = {
  select?: string;
  order?: string;
  limit?: number;
  filters?: Record<string, string | number | boolean>;
};

function buildUrl(baseUrl: string, table: string, options: QueryOptions = {}) {
  const url = new URL(`/rest/v1/${table}`, baseUrl);
  url.searchParams.set("select", options.select ?? "*");

  if (options.order) url.searchParams.set("order", options.order);
  if (options.limit) url.searchParams.set("limit", String(options.limit));

  for (const [key, value] of Object.entries(options.filters ?? {})) {
    url.searchParams.set(key, `eq.${String(value)}`);
  }

  return url;
}

export async function supabaseRpc<T>(functionName: string, body: Record<string, unknown> = {}): Promise<T> {
  const { supabase } = getServerEnvironment();
  const url = new URL(`/rest/v1/rpc/${functionName}`, supabase.url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: supabase.publishableKey,
      Authorization: `Bearer ${supabase.publishableKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase RPC failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as T;
}

export async function supabaseSelect<T>(table: string, options: QueryOptions = {}): Promise<T[]> {
  const { supabase } = getServerEnvironment();

  if (!supabase.serviceRoleKey) {
    throw new Error("Service-role Supabase access is not configured for this operation.");
  }

  const response = await fetch(buildUrl(supabase.url, table, options), {
    headers: {
      apikey: supabase.serviceRoleKey,
      Authorization: `Bearer ${supabase.serviceRoleKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase query failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as T[];
}
