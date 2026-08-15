import { getServerEnvironment } from "@/lib/env/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const environment = getServerEnvironment();

  return Response.json(
    {
      ok: true,
      supabase: {
        configured: Boolean(environment.supabase?.url && environment.supabase?.publishableKey),
        serviceRoleConfigured: Boolean(environment.supabase?.serviceRoleKey),
      },
      openai: {
        configured: Boolean(environment.openai?.apiKey),
        model: environment.openai?.model ?? null,
      },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
