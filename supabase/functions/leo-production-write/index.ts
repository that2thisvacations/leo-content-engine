import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const VERIFY_URL = "https://leo-content-engine.vercel.app/api/internal/verify-write-proof";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function verifyProof(payload: string, proof: string) {
  const response = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload, proof }),
  });
  return response.ok;
}

async function rest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE,
      authorization: `Bearer ${SERVICE_ROLE}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase REST ${response.status}: ${detail}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const payloadRaw = typeof body?.payload === "string" ? body.payload : "";
    const proof = typeof body?.proof === "string" ? body.proof : "";
    if (!payloadRaw || !proof) return json({ ok: false, error: "Missing signed payload" }, 400);
    if (!(await verifyProof(payloadRaw, proof))) return json({ ok: false, error: "Invalid write proof" }, 401);

    const payload = JSON.parse(payloadRaw);
    const action = payload?.action;

    if (action === "resolve_episode") {
      const slug = typeof payload?.slug === "string" ? payload.slug.trim() : "";
      if (!slug || slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return json({ ok: false, error: "Invalid episode slug" }, 400);
      }

      const rows = await rest(
        `leo_episodes?slug=eq.${encodeURIComponent(slug)}&select=id,destination_id,episode_number,slug,title,working_title,status,learning_pillars,synopsis,youtube_title,youtube_video_id,published_at,created_at,updated_at&limit=1`,
      );
      const resolvedEpisode = Array.isArray(rows) ? rows[0] : null;
      if (!resolvedEpisode) return json({ ok: false, error: "Episode not found" }, 404);
      return json({ ok: true, action, episode: resolvedEpisode });
    }

    const episodeId = payload?.episodeId;
    if (!isUuid(episodeId)) return json({ ok: false, error: "Invalid episode id" }, 400);

    const episodeRows = await rest(`leo_episodes?id=eq.${episodeId}&select=id,slug,status,title`);
    const episode = Array.isArray(episodeRows) ? episodeRows[0] : null;
    if (!episode) return json({ ok: false, error: "Episode not found" }, 404);

    if (action === "persist_plan") {
      const plan = payload?.plan;
      if (!plan || !Array.isArray(plan.scenes) || plan.scenes.length < 6) {
        return json({ ok: false, error: "Invalid episode plan" }, 400);
      }

      await rest("leo_episode_plans?on_conflict=episode_id", {
        method: "POST",
        headers: { prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          episode_id: episodeId,
          plan,
          status: "review_required",
          generated_at: new Date().toISOString(),
          reviewed_at: null,
          approved_at: null,
          reviewer_notes: null,
        }),
      });

      const scenes = plan.scenes.map((scene: any) => ({
        episode_id: episodeId,
        scene_number: scene.number,
        title: scene.title,
        purpose: scene.goal ?? null,
        narration: scene.dialogue ?? null,
        dialogue: scene.dialogue ? [{ speaker: "LEO", text: scene.dialogue }] : [],
        visual_prompt: scene.visual ?? null,
        duration_seconds: scene.duration_seconds ?? null,
        status: "prompt_ready",
      }));

      await rest("leo_scenes?on_conflict=episode_id,scene_number", {
        method: "POST",
        headers: { prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(scenes),
      });

      const reviews = ["facts", "culture", "safety", "character", "producer"].map((review_type) => ({
        episode_id: episodeId,
        review_type,
        status: "pending",
      }));
      await rest("leo_reviews?on_conflict=episode_id,review_type", {
        method: "POST",
        headers: { prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify(reviews),
      });

      await rest(`leo_episodes?id=eq.${episodeId}`, {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({ status: "storyboarding" }),
      });

      return json({ ok: true, action, episode: { id: episode.id, slug: episode.slug }, sceneCount: scenes.length });
    }

    if (action === "approve_plan") {
      const notes = typeof payload?.notes === "string" ? payload.notes.slice(0, 4000) : null;
      const now = new Date().toISOString();

      await rest(`leo_episode_plans?episode_id=eq.${episodeId}`, {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({ status: "approved", reviewed_at: now, approved_at: now, reviewer_notes: notes }),
      });
      await rest(`leo_reviews?episode_id=eq.${episodeId}&review_type=eq.producer`, {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({ status: "passed", notes, reviewed_at: now }),
      });
      await rest(`leo_episodes?id=eq.${episodeId}`, {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({ status: "storyboard_ready" }),
      });

      return json({ ok: true, action, episode: { id: episode.id, slug: episode.slug }, status: "storyboard_ready" });
    }

    if (action === "get_production") {
      const plans = await rest(`leo_episode_plans?episode_id=eq.${episodeId}&select=*`);
      const scenes = await rest(`leo_scenes?episode_id=eq.${episodeId}&select=*&order=scene_number.asc`);
      const reviews = await rest(`leo_reviews?episode_id=eq.${episodeId}&select=*&order=review_type.asc`);
      return json({ ok: true, episode, plan: Array.isArray(plans) ? plans[0] ?? null : null, scenes, reviews });
    }

    return json({ ok: false, error: "Unknown action" }, 400);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Unknown production write error" }, 500);
  }
});
