# LEO protected proof-render rollout

The founder-only render API is **fail-closed** until the existing production approval flow is extended with a persisted `render_approved` stage and a secure spending controller.

## Current limitation

The current LEO database/storyboard workflow stops at `storyboard_review_required`. Plan approval does **not** authorize paid rendering. The existing RunPod adapter can submit jobs but does not enforce a budget, durable job ledger, idempotency, or worker-output validation. Therefore **do not enable** `LEO_PROOF_RENDER_ENABLED` in Vercel yet.

The new API checks server-side production state and requires plan status `approved` AND episode status `render_approved` before calling RunPod. The flag defaults to disabled. The API also validates incoming inputs. These are interim blockers, not substitutes for the full production queue.

## Required subsequent work before opt-in

1. Add a founder approval action behind the signed production Edge Function; persist storyboard approval, intended scene/job, max authorized spend, approver identity, timestamp, and an expiration. Enforce that only reviewed scene assets/prompts can render.
2. Add a durable job queue, unique idempotency keys, atomic spend reservation/limits (per job, per day, per founder), retry accounting, and RunPod completion/cancel tracking.
3. Limit the first live proof to a single approved scene on the dedicated LEO endpoint. Validate the worker schema and expected output before extending to full episodes.
4. Integrate the HMAC n8n receiver, render progress callback, QC, and final publication review. Confirm LEO's YouTube channel identity via authenticated API before any uploads.
5. Test missing approval, expired approval, replay/duplicate request, missing limit, failed worker, out-of-budget render, and auth bypass. Keep MediaBuddy infrastructure isolated.

Never use a browser to supply RunPod keys. Never place secrets in version control. Never make a public YouTube upload without separate final founder approval.
