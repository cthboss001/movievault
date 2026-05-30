import { env } from "@/lib/env";
import { imdbProvider, letterboxdProvider } from "@/lib/sync/providers";
import { runPublicProfileSync } from "@/lib/sync/sync-runner";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleSyncRequest(request);
}

export async function GET(request: Request) {
  return handleSyncRequest(request);
}

async function handleSyncRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  const isLocalDevelopment = process.env.NODE_ENV !== "production";

  if (!isLocalDevelopment && (!env.SYNC_SECRET || token !== env.SYNC_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.DATABASE_URL) {
    return Response.json(
      {
        error:
          "DATABASE_URL is missing. Add a PostgreSQL connection string to .env, run the migration once, then press Sync again."
      },
      { status: 500 }
    );
  }

  try {
    const result = await runPublicProfileSync([imdbProvider, letterboxdProvider]);

    return Response.json({ result });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "MovieVault could not complete sync."
      },
      { status: 500 }
    );
  }
}
