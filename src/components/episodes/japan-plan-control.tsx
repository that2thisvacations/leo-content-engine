"use client";

import { useEffect, useState } from "react";

import styles from "./japan-plan-control.module.css";

type Scene = {
  number?: number;
  scene_number?: number;
  title?: string;
  goal?: string;
  purpose?: string;
  dialogue?: string;
  narration?: string;
  visual?: string;
  visual_prompt?: string;
  duration_seconds?: number;
};

type EpisodePlan = {
  title?: string;
  logline?: string;
  audience?: string;
  learningGoals?: string[];
  learning_goals?: string[];
  scenes?: Scene[];
};

type PlanResponse = {
  ok?: boolean;
  error?: string;
  plan?: EpisodePlan;
  persisted?: boolean;
  sceneCount?: number;
  approvalRequired?: boolean;
};

type ProductionResponse = {
  ok?: boolean;
  error?: string;
  plan?: { status?: string; plan?: EpisodePlan } | null;
  scenes?: Scene[];
};

type ReviewActionResponse = {
  ok?: boolean;
  error?: string;
  status?: string;
  nextStage?: string;
};

function messageFrom(value: unknown, fallback: string) {
  if (value && typeof value === "object" && "error" in value && typeof value.error === "string") {
    return value.error;
  }
  return fallback;
}

export function JapanPlanControl() {
  const [status, setStatus] = useState<"idle" | "planning" | "ready" | "approving" | "approved" | "revising" | "revision_requested" | "error">("idle");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<EpisodePlan | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [planStatus, setPlanStatus] = useState("not_started");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPersistedPlan() {
      try {
        const response = await fetch("/api/episodes/japan-001/production", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) return;

        const result = (await response.json()) as ProductionResponse;
        const persistedPlan = result.plan?.plan ?? null;
        if (!active || !persistedPlan) return;

        const persistedScenes = result.scenes ?? persistedPlan.scenes ?? [];
        const persistedStatus = result.plan?.status ?? "review_required";
        setPlan(persistedPlan);
        setScenes(persistedScenes);
        setPlanStatus(persistedStatus);

        if (persistedStatus === "approved") {
          setStatus("approved");
          setMessage("Japan plan approved. Storyboarding is unlocked; no media generation or publishing has started.");
        } else if (persistedStatus === "changes_requested") {
          setStatus("revision_requested");
          setMessage("Revision notes are saved. The approval gate remains active.");
        } else {
          setStatus("ready");
          setMessage(`Japan plan persisted with ${persistedScenes.length} scenes. Human approval is required before storyboarding.`);
        }
      } catch {
        // Keep the control idle when no founder-authorized production state is available.
      }
    }

    void loadPersistedPlan();
    return () => {
      active = false;
    };
  }, []);

  async function startJapanPilot() {
    if (status === "planning") return;

    setStatus("planning");
    setMessage("LEO is researching Japan and building the episode plan…");

    try {
      const planResponse = await fetch("/api/episodes/japan-001/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
      });
      const planResult = (await planResponse.json()) as PlanResponse;

      if (!planResponse.ok || planResult.ok === false) {
        throw new Error(messageFrom(planResult, `Planning failed (${planResponse.status}).`));
      }

      const productionResponse = await fetch("/api/episodes/japan-001/production", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const productionResult = (await productionResponse.json()) as ProductionResponse;

      if (!productionResponse.ok || productionResult.ok === false) {
        throw new Error(messageFrom(productionResult, `Production verification failed (${productionResponse.status}).`));
      }

      const persistedPlan = productionResult.plan?.plan ?? planResult.plan ?? null;
      const persistedScenes = productionResult.scenes ?? persistedPlan?.scenes ?? [];

      setPlan(persistedPlan);
      setScenes(persistedScenes);
      setPlanStatus(productionResult.plan?.status ?? "review_required");
      setStatus("ready");
      setMessage(`Japan plan persisted with ${persistedScenes.length || planResult.sceneCount || 0} scenes. Human approval is required before storyboarding.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to build the Japan plan.");
    }
  }

  async function approvePlan() {
    if (!window.confirm("Approve this Japan plan and unlock storyboarding? This will not generate media or publish to YouTube.")) return;

    setStatus("approving");
    setMessage("Recording founder approval…");
    try {
      const response = await fetch("/api/episodes/japan-001/approve-plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ notes: "Approved from the founder production dashboard." }),
      });
      const result = (await response.json()) as ReviewActionResponse;
      if (!response.ok || result.ok === false) {
        throw new Error(messageFrom(result, `Approval failed (${response.status}).`));
      }
      setPlanStatus(result.nextStage ?? result.status ?? "storyboard_ready");
      setStatus("approved");
      setMessage("Japan plan approved. Storyboarding is unlocked; no media generation or publishing has started.");
      setShowRevisionForm(false);
    } catch (error) {
      setStatus("ready");
      setMessage(error instanceof Error ? error.message : "Unable to approve the Japan plan.");
    }
  }

  async function requestRevisions() {
    const notes = revisionNotes.trim();
    if (notes.length < 5) {
      setMessage("Add a short revision note before submitting.");
      return;
    }
    if (!window.confirm("Send these revision notes and keep the plan blocked from storyboarding?")) return;

    setStatus("revising");
    setMessage("Recording revision request…");
    try {
      const response = await fetch("/api/episodes/japan-001/request-revisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ notes }),
      });
      const result = (await response.json()) as ReviewActionResponse;
      if (!response.ok || result.ok === false) {
        throw new Error(messageFrom(result, `Revision request failed (${response.status}).`));
      }
      setPlanStatus(result.status ?? "changes_requested");
      setStatus("revision_requested");
      setMessage("Revision notes saved. The approval gate remains active and storyboarding is blocked.");
      setShowRevisionForm(false);
    } catch (error) {
      setStatus("ready");
      setMessage(error instanceof Error ? error.message : "Unable to request revisions.");
    }
  }

  const learningGoals = plan?.learningGoals ?? plan?.learning_goals ?? [];
  const showPlan = plan && ["ready", "approving", "approved", "revising", "revision_requested"].includes(status);
  const canReview = status === "ready" || planStatus === "review_required";

  return (
    <div className={styles.control} id="japan-pilot">
      <button className={styles.action} type="button" onClick={startJapanPilot} disabled={["planning", "approving", "revising"].includes(status)}>
        {status === "planning" ? "Building Japan Plan…" : "Start Japan Pilot →"}
      </button>

      {status !== "idle" ? (
        <section className={`${styles.statusPanel} ${status === "error" ? styles.error : ""}`} aria-live="polite">
          <div className={styles.statusHeading}>
            <span>{status === "approved" ? "PLAN APPROVED" : status === "revision_requested" ? "REVISIONS REQUESTED" : status === "error" ? "ACTION REQUIRED" : status === "planning" ? "PRODUCTION PLANNING" : "PLAN READY FOR REVIEW"}</span>
            {showPlan ? <strong>{planStatus.replaceAll("_", " ")}</strong> : null}
          </div>
          <p>{message}</p>

          {showPlan ? (
            <div className={styles.review}>
              <h3>{plan.title ?? "LEO’s First Big Adventure: Japan"}</h3>
              {plan.logline ? <p>{plan.logline}</p> : null}
              {canReview ? (
                <div className={styles.reviewControls}>
                  <button className={styles.approve} type="button" onClick={approvePlan}>Approve Japan Plan</button>
                  <button className={styles.revise} type="button" onClick={() => setShowRevisionForm((value) => !value)}>Request Revisions</button>
                </div>
              ) : null}

              {showRevisionForm && canReview ? (
                <div className={styles.revisionForm}>
                  <label htmlFor="japan-revision-notes">Revision notes</label>
                  <textarea id="japan-revision-notes" value={revisionNotes} onChange={(event) => setRevisionNotes(event.target.value)} maxLength={4000} placeholder="Example: Adjust scene 5 to include a child-friendly allergy reminder." />
                  <div><button className={styles.submitRevision} type="button" onClick={requestRevisions}>Submit Revision Request</button><button className={styles.cancel} type="button" onClick={() => setShowRevisionForm(false)}>Cancel</button></div>
                </div>
              ) : null}

              {learningGoals.length ? <div><h4>Learning goals</h4><ul>{learningGoals.map((goal) => <li key={goal}>{goal}</li>)}</ul></div> : null}
              <div>
                <h4>Persisted scenes</h4>
                <ol className={styles.scenes}>
                  {scenes.map((scene, index) => <li key={scene.number ?? scene.scene_number ?? index}><strong>{scene.title ?? `Scene ${index + 1}`}</strong><span>{scene.goal ?? scene.purpose ?? scene.dialogue ?? scene.narration ?? "Scene plan persisted."}</span></li>)}
                </ol>
              </div>
              <div className={styles.gate}>
                <strong>{status === "approved" ? "PLAN APPROVED — STORYBOARDING UNLOCKED" : "HUMAN APPROVAL GATE ACTIVE"}</strong>
                <span>No media generation, assembly, or YouTube upload has started.</span>
              </div>

            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
