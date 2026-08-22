"use client";

import { useState } from "react";

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

function messageFrom(value: unknown, fallback: string) {
  if (value && typeof value === "object" && "error" in value && typeof value.error === "string") {
    return value.error;
  }
  return fallback;
}

export function JapanPlanControl() {
  const [status, setStatus] = useState<"idle" | "planning" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<EpisodePlan | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [planStatus, setPlanStatus] = useState("not_started");

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
      setMessage(
        `Japan plan persisted with ${persistedScenes.length || planResult.sceneCount || 0} scenes. Human approval is required before storyboarding.`,
      );
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to build the Japan plan.");
    }
  }

  const learningGoals = plan?.learningGoals ?? plan?.learning_goals ?? [];

  return (
    <div className={styles.control} id="japan-pilot">
      <button
        className={styles.action}
        type="button"
        onClick={startJapanPilot}
        disabled={status === "planning"}
      >
        {status === "planning" ? "Building Japan Plan…" : "Start Japan Pilot →"}
      </button>

      {status !== "idle" ? (
        <section className={`${styles.statusPanel} ${status === "error" ? styles.error : ""}`} aria-live="polite">
          <div className={styles.statusHeading}>
            <span>{status === "ready" ? "PLAN READY FOR REVIEW" : status === "error" ? "ACTION REQUIRED" : "PRODUCTION PLANNING"}</span>
            {status === "ready" ? <strong>{planStatus.replaceAll("_", " ")}</strong> : null}
          </div>
          <p>{message}</p>

          {status === "ready" && plan ? (
            <div className={styles.review}>
              <h3>{plan.title ?? "LEO’s First Big Adventure: Japan"}</h3>
              {plan.logline ? <p>{plan.logline}</p> : null}
              {learningGoals.length ? (
                <div>
                  <h4>Learning goals</h4>
                  <ul>{learningGoals.map((goal) => <li key={goal}>{goal}</li>)}</ul>
                </div>
              ) : null}
              <div>
                <h4>Persisted scenes</h4>
                <ol className={styles.scenes}>
                  {scenes.map((scene, index) => (
                    <li key={scene.number ?? scene.scene_number ?? index}>
                      <strong>{scene.title ?? `Scene ${index + 1}`}</strong>
                      <span>{scene.goal ?? scene.purpose ?? scene.dialogue ?? scene.narration ?? "Scene plan persisted."}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className={styles.gate}>
                <strong>HUMAN APPROVAL GATE ACTIVE</strong>
                <span>No storyboard, media, assembly, or YouTube upload has started.</span>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
