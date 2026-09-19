# LEO RunPod Wan 2.2 production worker

LEO uses a dedicated RunPod Serverless endpoint. MediaBuddy is not modified or shared.

## Required Vercel variables

- RUNPOD_API_KEY — server-only restricted RunPod credential.
- RUNPOD_ENDPOINT_ID — dedicated LEO endpoint ID.

Never expose either variable through NEXT_PUBLIC_*.

## Worker contract

The LEO engine submits queue jobs to POST /v2/{endpoint}/run and polls /status/{jobId}.

Input:
- image: canonical/keyframe image (URL or worker-supported encoded image)
- prompt
- negative_prompt
- width/height (defaults 480x832 for vertical proof renders)
- seed
- loras

The worker must return a RunPod job id. Output parsing is intentionally worker-version agnostic until the dedicated Wan 2.2 worker is deployed and its exact schema is verified.

## Deployment policy

Use a dedicated endpoint named leo-wan22-production. Scale to zero when idle. Start with one worker and one proof scene. Do not alter the existing MediaBuddy endpoint.

Do not use the Hub ksampler build whose own README marks it unstable. Pin the worker/model/workflow versions before production.
