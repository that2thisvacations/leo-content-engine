import type { LeoJobStore } from "./leo-n8n-dispatch";

/**
 * REST adapter for the existing leo_production_jobs table.
 * Use only on a trusted server. The service-role key must never be exposed
 * to a client bundle or an untrusted webhook.
 */
export class LeoSupabaseJobStore implements LeoJobStore {
  constructor(
    private readonly url: string,
    private readonly serviceKey: string
  ) {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") throw new Error("Supabase URL must be HTTPS");
    if (!serviceKey) throw new Error("Supabase service key is required");
  }
  private headers(extra: Record<string,string> = {}): HeadersInit {
    return {
      apikey: this.serviceKey,
      Authorization: `Bearer ${this.serviceKey}`,
      "Content-Type": "application/json",
      ...extra,
    };
  }
  async reserve(record: Parameters<LeoJobStore["reserve"]>[0]): Promise<void> {
    const response = await fetch(`${this.url.replace(/\/$/,"")}/rest/v1/leo_production_jobs`, {
      method: "POST",
      headers: this.headers({ Prefer: "return=minimal" }),
      body: JSON.stringify(record),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Unable to reserve Leo production job (HTTP ${response.status})`);
  }
  async markDispatchFailed(jobId: string, reason: string): Promise<void> {
    const response = await fetch(
      `${this.url.replace(/\/$/,"")}/rest/v1/leo_production_jobs?id=eq.${encodeURIComponent(jobId)}&status=eq.queued`,
      {
        method: "PATCH",
        headers: this.headers({ Prefer: "return=minimal" }),
        body: JSON.stringify({ status: "failed", error_message: reason }),
        cache: "no-store",
      }
    );
    if (!response.ok) throw new Error(`Unable to mark Leo dispatch failure (HTTP ${response.status})`);
  }
}
