import "server-only";

import { getServerEnvironment } from "@/lib/env/server";

export type RunPodVideoRequest = {
  image: string;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  loras?: Array<{ url: string; strength?: number }>;
};

type RunPodSubmitResponse = { id?: string; status?: string; error?: string };

export async function submitRunPodVideo(request: RunPodVideoRequest) {
  const { runpod } = getServerEnvironment();
  if (!runpod) throw new Error("RunPod is not configured.");

  const response = await fetch(`https://api.runpod.ai/v2/${runpod.endpointId}/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${runpod.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        image: request.image,
        prompt: request.prompt,
        negative_prompt: request.negativePrompt ?? "blurry, low quality, distorted, deformed, duplicate",
        width: request.width ?? 480,
        height: request.height ?? 832,
        seed: request.seed,
        loras: request.loras ?? [],
      },
    }),
    cache: "no-store",
  });

  const result = (await response.json()) as RunPodSubmitResponse;
  if (!response.ok || !result.id) {
    throw new Error(result.error ?? `RunPod submission failed (${response.status}).`);
  }
  return { jobId: result.id, status: result.status ?? "IN_QUEUE" };
}

export async function getRunPodJob(jobId: string) {
  const { runpod } = getServerEnvironment();
  if (!runpod) throw new Error("RunPod is not configured.");
  const response = await fetch(`https://api.runpod.ai/v2/${runpod.endpointId}/status/${encodeURIComponent(jobId)}`, {
    headers: { Authorization: `Bearer ${runpod.apiKey}` },
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`RunPod status failed (${response.status}).`);
  return result;
}
