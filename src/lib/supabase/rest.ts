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

export async function supabaseSelect<T>(table: string, options: QueryOptions = {}): Promise<T[]> {
  const environment = getServerEnvironment();
  const supabase = environment.supabase;

  if (!supabase) {
    throw new Error("Supabase is not configured for the LEO Content Engine runtime.");
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
