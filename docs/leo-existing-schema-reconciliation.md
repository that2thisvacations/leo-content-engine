# Leo n8n integration — existing Supabase schema reconciliation

Verified against the connected `travelbuddy-content-engine` Supabase project on 2026-10-20.

The production database already contains:
- `public.leo_episodes` — episode IDs, title, script, status, publishing metadata.
- `public.leo_episode_plans` — structured plan JSON, status, review and approval timestamps.
- `public.leo_production_jobs` — UUID job and episode IDs, optional scene ID, job_type, provider, status, input/output JSON, retry_count, cost_usd, started_at, finished_at, error_message.

**Do not apply** `20261020193000_leo_episode_queue.sql` to this project. It was authored before the existing schema was inspected and would introduce redundant `leo_episode_jobs` and `leo_episode_job_events` tables.

## Revised integration plan
1. Resolve the canonical `leo_episodes.id` UUID from an authenticated episode selection.
2. Enforce a unique job-idempotency strategy against `leo_production_jobs`, using an additive constraint/index only after reviewing existing records and query paths.
3. Persist a `leo_production_jobs` row before calling n8n. The existing `input` JSONB can store the request version, signed job ID and continuity metadata; `output` can store provider result references.
4. Ensure the n8n receiver verifies the HMAC signature and replays, then updates only the pre-existing job row via a restricted service credential.
5. Use `leo_episode_plans` approval fields and the existing review process for human sign-off.
6. Never infer owner permissions from the webhook body. Derive the authenticated user from the application's authorization layer and confirm database access policy before adding a public enqueue endpoint.
7. Do not publish on n8n completion; completed renders become reviewable drafts.

## Outstanding
- Confirm RLS and exact permission model on existing Leo tables.
- Confirm n8n instance and secure webhook endpoint.
- Confirm RunPod/Wan worker availability and provider credentials.
- Run automated tests and one low-cost proof scene.
- Check deployment and PR mergeability.

This reconciliation is documentation only; no database writes or live workflow changes were made.
