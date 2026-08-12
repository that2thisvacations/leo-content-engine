import "server-only";

type SupabaseEnvironment = {
  url: string;
  publishableKey: string;
  serviceRoleKey: string;
};

export type ServerEnvironment = {
  nodeEnv: "development" | "production" | "test";
  supabase: SupabaseEnvironment | null;
};

function readOptional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value === "" ? undefined : value;
}

export function getServerEnvironment(): ServerEnvironment {
  const url = readOptional("SUPABASE_URL");
  const publishableKey = readOptional("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = readOptional("SUPABASE_SERVICE_ROLE_KEY");
  const configuredValues = [url, publishableKey, serviceRoleKey].filter(Boolean).length;

  if (configuredValues > 0 && configuredValues < 3) {
    throw new Error(
      "Supabase configuration is incomplete. Configure all server-side Supabase variables together.",
    );
  }

  return {
    nodeEnv: (process.env.NODE_ENV ?? "development") as ServerEnvironment["nodeEnv"],
    supabase:
      url && publishableKey && serviceRoleKey
        ? { url, publishableKey, serviceRoleKey }
        : null,
  };
}
