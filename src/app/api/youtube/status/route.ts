import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/env/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { youtube, supabase } = getServerEnvironment();

  if (!youtube) {
    return NextResponse.json({ ok: true, configured: false, connected: false }, { headers: { "Cache-Control": "no-store" } });
  }

  if (!supabase.serviceRoleKey) {
    return NextResponse.json(
      { ok: true, configured: true, connected: false, storage: "service_role_missing" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const response = await fetch(
    `${supabase.url}/rest/v1/leo_youtube_connections?provider=eq.youtube&select=channel_id,channel_title,connected_at&limit=1`,
    {
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ ok: false, error: detail }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const rows = (await response.json()) as Array<{
    channel_id: string;
    channel_title: string;
    connected_at: string;
  }>;
  const connection = rows[0];

  return NextResponse.json(
    {
      ok: true,
      configured: true,
      connected: Boolean(connection),
      channel: connection
        ? {
            id: connection.channel_id,
            title: connection.channel_title,
            connectedAt: connection.connected_at,
          }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
