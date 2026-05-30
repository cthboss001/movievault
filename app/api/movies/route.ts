import { getMovieSearchIndex } from "@/lib/movies";

export const dynamic = "force-dynamic";

export async function GET() {
  const movies = await getMovieSearchIndex();

  return Response.json({ movies });
}
