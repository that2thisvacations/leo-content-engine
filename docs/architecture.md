# LEO Content Engine architecture

The initial application is a Next.js App Router foundation designed for Vercel and Node.js 22. The dashboard is server-rendered by default and contains no provider SDKs.

## Provider boundary

External systems are represented by capability interfaces in `src/lib/providers/contracts.ts`. Future adapters should implement one interface at a time and remain behind server-only modules. The dashboard reads only non-sensitive provider metadata from the catalog.

No PiAPI, OpenAI, YouTube, n8n, ViMax, or Supabase client has been connected in this foundation.

## Environment variables

Copy `.env.example` to `.env.local` for local development. Never commit `.env.local` or any populated environment file. Production values belong in Vercel environment settings and should be scoped independently for Development, Preview, and Production.

Only variables beginning with `NEXT_PUBLIC_` may be exposed to client components. Supabase placeholders are server-only, and the service-role key must never cross a server boundary.

## Runtime

- Node.js: 22.x
- Application: Next.js App Router
- Deployment: Vercel-native Next.js build output
- Health check: `GET /api/health`
