import "server-only";

import { getServerEnvironment } from "@/lib/env/server";
import type { LeoEpisode } from "@/lib/leo/episodes";

export type LeoEpisodePlan = {
  episode_title: string;
  hook: string;
  story_arc: string;
  learning_beats: string[];
  money_moment: {
    item: string;
    local_price: string;
    local_currency: string;
    usd_note: string;
  };
  scenes: Array<{
    number: number;
    title: string;
    goal: string;
    visual: string;
    duration_seconds: number;
    dialogue: string;
  }>;
  parent_travel_bridge: string;
  source_urls: string[];
};

const episodePlanSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "episode_title",
    "hook",
    "story_arc",
    "learning_beats",
    "money_moment",
    "scenes",
    "parent_travel_bridge",
    "source_urls",
  ],
  properties: {
    episode_title: { type: "string" },
    hook: { type: "string" },
    story_arc: { type: "string" },
    learning_beats: { type: "array", items: { type: "string" } },
    money_moment: {
      type: "object",
      additionalProperties: false,
      required: ["item", "local_price", "local_currency", "usd_note"],
      properties: {
        item: { type: "string" },
        local_price: { type: "string" },
        local_currency: { type: "string" },
        usd_note: { type: "string" },
      },
    },
    scenes: {
      type: "array",
      minItems: 6,
      maxItems: 14,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["number", "title", "goal", "visual", "duration_seconds", "dialogue"],
        properties: {
          number: { type: "integer" },
          title: { type: "string" },
          goal: { type: "string" },
          visual: { type: "string" },
          duration_seconds: { type: "integer", minimum: 3, maximum: 90 },
          dialogue: { type: "string" },
        },
      },
    },
    parent_travel_bridge: { type: "string" },
    source_urls: { type: "array", items: { type: "string" } },
  },
} as const;

type ResponsesApiResult = {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

function extractOutputText(result: ResponsesApiResult): string {
  return (result.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("");
}

export async function generateLeoEpisodePlan(episode: LeoEpisode): Promise<LeoEpisodePlan> {
  const { openai } = getServerEnvironment();

  if (!openai) {
    throw new Error("OpenAI is not configured. Add OPENAI_API_KEY to the Vercel runtime.");
  }

  const prompt = `You are the executive story producer and research planner for LEO, a family-safe animated travel-inspiration edutainment YouTube channel for children roughly ages 6-10 and their parents.

Episode: ${episode.title}
Slug: ${episode.slug}
Learning pillars: ${episode.learning_pillars.join(", ")}
Current status: ${episode.status}

LEO is a curious lion cub traveler with a passport satchel. His magical tail-tip dust teleports him to destinations. He respectfully learns with local people rather than presenting stereotypes. His signature close asks: "How would YOU like to visit and see it for yourself?"

Research current, reliable destination information using web search. Build a production-ready episode plan. Include culture, geography, food, language, transportation or activities where appropriate. Include one LEO'S MONEY MOMENT™ using local currency and an approximate USD explanation, clearly noting that exchange rates change. Avoid dangerous imitation behavior, stereotypes, unsupported historical claims, and commercial pressure directed at children. The parent travel bridge should inspire family discussion without turning the children's segment into an advertisement.

Return only the structured episode plan.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openai.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openai.model,
      store: false,
      tools: [{ type: "web_search" }],
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "leo_episode_plan",
          strict: true,
          schema: episodePlanSchema,
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI episode planning failed (${response.status}): ${detail}`);
  }

  const result = (await response.json()) as ResponsesApiResult;
  const outputText = extractOutputText(result);

  if (!outputText) {
    throw new Error("OpenAI returned no structured episode plan text.");
  }

  return JSON.parse(outputText) as LeoEpisodePlan;
}
