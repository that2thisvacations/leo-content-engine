import "server-only";

type SupabaseEnvironment = {
  url: string;
  publishableKey: string;
  serviceRoleKey?: string;
};

type OpenAIEnvironment = {
  apiKey: string;
  model: string;
};

type YouTubeEnvironment = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type ServerEnvironment = {
  nodeEnv: "development" | "production" | "test";
  supabase: SupabaseEnvironment;
  openai: OpenAIEnvironment | null;
  youtube: YouTubeEnvironment | null;
};

const DEFAULT_SUPABASE_URL = "https://onynvujitliqugkudkjp.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WqNSC-g7B9_WHNW1rbHhIg_qoJHAVYi";

function readOptional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value === "" ? undefined : value;
}

export function getServerEnvironment(): ServerEnvironment {
  const url = readOptional("SUPABASE_URL") ?? DEFAULT_SUPABASE_URL;
  const publishableKey = readOptional("SUPABASE_PUBLISHABLE_KEY") ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = readOptional("SUPABASE_SERVICE_ROLE_KEY");
  const openaiApiKey = readOptional("OPENAI_API_KEY");
  const openaiModel = readOptional("OPENAI_MODEL") ?? "gpt-5";
  const youtubeClientId = readOptional("YOUTUBE_CLIENT_ID");
  const youtubeClientSecret = readOptional("YOUTUBE_CLIENT_SECRET");
  const youtubeRedirectUri = readOptional("YOUTUBE_REDIRECT_URI");

  return {
    nodeEnv: (process.env.NODE_ENV ?? "development") as ServerEnvironment["nodeEnv"],
    supabase: { url, publishableKey, serviceRoleKey },
    openai: openaiApiKey ? { apiKey: openaiApiKey, model: openaiModel } : null,
    youtube:
      youtubeClientId && youtubeClientSecret && youtubeRedirectUri
        ? {
            clientId: youtubeClientId,
            clientSecret: youtubeClientSecret,
            redirectUri: youtubeRedirectUri,
          }
        : null,
  };
}
