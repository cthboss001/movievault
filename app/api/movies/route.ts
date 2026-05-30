import { env } from "@/lib/env";
import { getMovieSearchIndex } from "@/lib/movies";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!env.DATABASE_URL) {
    return Response.json({ movies: [], databaseMissing: true });
  }

  try {
    const movies = await getMovieSearchIndex();
    return Response.json({ movies });
  } catch (error) {
    console.error("[/api/movies]", error);
    return Response.json(
      {
        movies: [],
        error:
          error instanceof Error
            ? error.message
            : "Failed to load movies from database."
      },
      { status: 500 }
    );
  }
}
