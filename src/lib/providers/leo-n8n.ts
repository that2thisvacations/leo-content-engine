import { createHmac, randomUUID } from "node:crypto";
import type { ProviderHealth, WorkflowProvider } from "@/lib/providers/contracts";

export type LeoEpisodeJob = {
  episodeId: string;
  topic: string;
  durationSeconds: number;
  aspectRatio: "9:16" | "16:9";
  canonicalCharacterReferenceUrl: string;
  script?: string;
  requireApproval: true;
};

export function validateLeoEpisodeJob(input: unknown): LeoEpisodeJob {
  if (!input || typeof input !== "object") throw new Error("Episode job must be an object");
  const v = input as Record<string, unknown>;
  const episodeId = typeof v.episodeId === "string" ? v.episodeId.trim() : "";
  const topic = typeof v.topic === "string" ? v.topic.trim() : "";
  const url = typeof v.canonicalCharacterReferenceUrl === "string" ? v.canonicalCharacterReferenceUrl : "";
  const durationSeconds = Number(v.durationSeconds);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(episodeId)) throw new Error("Episode ID must match the existing Leo database UUID");
  if (!topic || topic.length > 1000) throw new Error("Episode topic must be 1–1000 characters");
  if (!Number.isInteger(durationSeconds) || durationSeconds < 10 || durationSeconds > 900) throw new Error("Duration must be 10–900 seconds");
  if (!/^https:\/\//i.test(url)) throw new Error("A secure canonical Leo reference URL is required");
  if (v.aspectRatio !== "9:16" && v.aspectRatio !== "16:9") throw new Error("Unsupported aspect ratio");
  if (v.requireApproval !== true) throw new Error("Human approval is required before publishing");
  const script = typeof v.script === "string" ? v.script.slice(0,20000) : undefined;
  return {episodeId,topic,durationSeconds,aspectRatio:v.aspectRatio,canonicalCharacterReferenceUrl:url,script,requireApproval:true};
}

export class LeoN8nWorkflowProvider implements WorkflowProvider {
  readonly capability = "workflow-orchestration" as const;
  async health(): Promise<ProviderHealth> {
    const configured = Boolean(process.env.LEO_N8N_WEBHOOK_URL && process.env.LEO_N8N_SIGNING_SECRET);
    return {configured,status:configured?"available":"not-configured"};
  }
  async enqueue(job: {type:string;payload:unknown}): Promise<{jobId:string}> {
    if (job.type !== "leo-episode") throw new Error("Unsupported workflow type");
    const payload = validateLeoEpisodeJob(job.payload);
    const endpoint = process.env.LEO_N8N_WEBHOOK_URL;
    const secret = process.env.LEO_N8N_SIGNING_SECRET;
    if (!endpoint || !secret) throw new Error("Leo n8n integration is not configured");
    if (secret.length < 32) throw new Error("Leo n8n signing secret must be at least 32 characters");
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname || url.hostname === "localhost" || /^(127\\.|10\\.|192\\.168\\.|169\\.254\\.)/.test(url.hostname)) throw new Error("Leo n8n webhook must use HTTPS without embedded credentials");
    const jobId = randomUUID();
    // This UUID must correspond to a durably reserved leo_production_jobs row
    // before the webhook is sent. Do not call enqueue directly from a public route.
    const body = JSON.stringify({version:1,jobId,type:"leo-episode",payload,creativeDirection:{
      character:"Leo the Lion",referencePolicy:"canonical-reference-required",
      style:"cinematic lifelike lion cub; physically convincing fur, anatomy, expressions and environmental lighting",
      continuity:"preserve passport satchel, golden travel dust, character proportions and voice across scenes",
      output:"scenes with narration/dialogue/music and a reviewable episode draft",
      publishing:"approval-required; never autopublish"
    }});
    const timestamp = Math.floor(Date.now()/1000).toString();
    const signature = createHmac("sha256",secret).update(timestamp+"."+body).digest("hex");
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),15000);
    try {
      const response = await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","X-Leo-Timestamp":timestamp,"X-Leo-Signature":signature,"X-Leo-Idempotency-Key":jobId},body,signal:controller.signal,cache:"no-store"});
      if(!response.ok)throw new Error("Leo orchestration webhook rejected request ("+response.status+")");
      return {jobId};
    } finally {clearTimeout(timer);}
  }
}
