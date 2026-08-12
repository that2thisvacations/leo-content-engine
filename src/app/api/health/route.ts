export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return Response.json(
    {
      service: "leo-content-engine",
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
