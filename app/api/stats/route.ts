import { env } from "@/lib/env";
import { getStats } from "@/lib/stats/get-stats";

export const dynamic = "force-dynamic";

const EMPTY_STATS = {
  totalWatched: 0,
  totalRuntimeMinutes: 0,
  averageRating: null,
  topGenres: [],
  watchedByYear: []
};

export async function GET() {
  if (!env.DATABASE_URL) {
    return Response.json({ stats: EMPTY_STATS, databaseMissing: true });
  }

  try {
    const stats = await getStats();
    return Response.json({ stats });
  } catch (error) {
    console.error("[/api/stats]", error);
    return Response.json({ stats: EMPTY_STATS }, { status: 500 });
  }
}
