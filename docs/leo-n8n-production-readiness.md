# Leo n8n production readiness checks

## Confirmed on 2026-10-20
- Connected Supabase project `travelbuddy-content-engine` has `leo_episodes`, `leo_episode_plans`, `leo_production_jobs`.
- All three tables have RLS enabled.
- `leo_production_jobs.episode_id` is a UUID foreign key to `leo_episodes.id`.
- `leo_episode_plans.episode_id` is a unique UUID foreign key to `leo_episodes.id`.
- The original draft migration introducing `leo_episode_jobs` must **not** be applied.

## Before connecting the webhook
- Determine actual RLS policies and server-only permissions (RLS enabled alone does not prove authorization).
- Reserve a production job in the existing table before invoking `LeoN8nWorkflowProvider.enqueue`. Current adapter creates its own random job ID and does not persist it: **do not expose it as a production route until this is fixed**.
- Ensure the n8n receiver validates signature, 5-minute timestamp window, unique job ID and exact persisted job state.
- Configure a durable callback for status updates, failure accounting and draft storage.
- Confirm dedicated Leo RunPod endpoint and PiAPI provider capabilities, without touching MediaBuddy's endpoint.
- Validate render credits and costs before submitting paid jobs.
- Run `npm run check` and test the full workflow with a low-cost proof scene.
- Keep YouTube publishing disabled until explicit approval.

## No-op rule
No live n8n workflow, migration, or production rendering should be activated merely because this document or the adapter was committed.
