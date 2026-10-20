import { randomUUID } from "node:crypto";
import { LeoN8nWorkflowProvider, validateLeoEpisodeJob, type LeoEpisodeJob } from "./leo-n8n";

export interface LeoJobStore {
  /** Insert into existing leo_production_jobs; must fail on duplicate UUID. */
  reserve(record: {
    id: string;
    episode_id: string;
    job_type: "episode";
    provider: "n8n";
    status: "queued";
    input: { version: 1; payload: LeoEpisodeJob };
  }): Promise<void>;
  /** Compare-and-set to failed only if still queued; never overwrite later states. */
  markDispatchFailed(jobId: string, reason: string): Promise<void>;
}

/**
 * Server-only orchestrator. Authorization, episode ownership and credit
 * reservation MUST be checked by the caller before this function is invoked.
 * No network request is sent until the durable database insert succeeds.
 */
export async function reserveAndDispatchLeoEpisode(
  input: unknown,
  store: LeoJobStore,
  provider: Pick<LeoN8nWorkflowProvider, "enqueue"> = new LeoN8nWorkflowProvider()
): Promise<{jobId: string}> {
  const payload = validateLeoEpisodeJob(input);
  const jobId = randomUUID();
  await store.reserve({
    id: jobId,
    episode_id: payload.episodeId,
    job_type: "episode",
    provider: "n8n",
    status: "queued",
    input: { version: 1, payload },
  });
  try {
    return await provider.enqueue({ type: "leo-episode", payload, jobId });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown dispatch error";
    try {
      await store.markDispatchFailed(jobId, reason.slice(0, 500));
    } catch {
      // Preserve the original dispatch failure; reconciliation can inspect
      // queued jobs left behind by an unavailable database.
    }
    throw error;
  }
}
