# Leo n8n episode orchestration — deployment contract

## Purpose
Use the user's supplied PiAPI animated-stories workflow as an orchestration reference, not a drop-in workflow. The supplied workflow makes three Midjourney images, three Kling videos, and a Creatomate render. Leo needs a variable-length cinematic episode pipeline with locked character references, dialogue, continuity, QA, and review before publishing.

## App adapter
`src/lib/providers/leo-n8n.ts` exports `LeoN8nWorkflowProvider` and `validateLeoEpisodeJob`. It signs the exact JSON request body with HMAC SHA-256: `hex(HMAC(secret, timestamp + "." + rawBody))`.

Required **server-only** environment variables:
- `LEO_N8N_WEBHOOK_URL` — dedicated HTTPS production webhook, not the public template webhook
- `LEO_N8N_SIGNING_SECRET` — random secret shared with the verifier in n8n

Headers: `X-Leo-Timestamp`, `X-Leo-Signature`, `X-Leo-Idempotency-Key`. The receiver must validate HMAC against **raw request bytes**, reject timestamp skew over five minutes, deduplicate job IDs, and never accept publishing instructions from the payload.

## n8n production stages
1. Signed webhook trigger and replay protection
2. Retrieve episode brief and canonical Leo reference
3. Story director: educational/adventure script and shot list with scene timings
4. Continuity validation: Leo anatomy, satchel, golden travel dust, voice and environment
5. Voice generation and dialogue timing
6. Scene/keyframe generation with PiAPI or existing dedicated RunPod Wan 2.2 provider
7. Bounded polling, retry, failure classification and cost accounting
8. Assemble episode, sound design, narration and captions with FFmpeg
9. Upload private draft, record review state
10. **Stop for human approval** before publishing

## Safety and architecture
- No API keys in Set nodes or browser-visible settings.
- No changes to the existing MediaBuddy endpoint; Leo RunPod deployment remains dedicated.
- Avoid importing the children's-book style and Niji prompts from the template.
- Do not assume PiAPI, n8n, RunPod or FFmpeg is deployed until verified.
- Limit webhook job duration and concurrency; meter paid video renders.
- Return `202 Accepted` only after durable job creation. A successful webhook response alone is not proof that a finished episode exists.

## Definition of done
An approved episode brief triggers one durable workflow; every scene passes character consistency checks; assembled episode plays with aligned voice/music; draft is accessible for review; no publishing occurs without explicit approval. Test replay attacks, missing credentials, provider failure, insufficient credits and duplicate jobs.
