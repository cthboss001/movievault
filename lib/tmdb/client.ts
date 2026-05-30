import { env } from "@/lib/env";

export interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  genre_ids: number[];
}

export async function searchMovie(title: string, year?: number | null): Promise<TMDBMovie | null> {
  if (!env.TMDB_API_KEY) {
    throw new Error("TMDB_API_KEY is not configured");
  }

  // TMDB v3 API authentication
  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("api_key", env.TMDB_API_KEY);
  url.searchParams.set("query", title);
  if (year) {
    url.searchParams.set("primary_release_year", year.toString());
  }
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error(`TMDB error for "${title}":`, await res.text());
    return null;
  }

  const data = await res.json();
  if (data.results && data.results.length > 0) {
    return data.results[0] as TMDBMovie; // Just grab the first (best) match
  }

  return null;
}
