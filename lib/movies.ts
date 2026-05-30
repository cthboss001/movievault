import { WatchSource } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { MovieSearchItem, MovieSource } from "@/types/movie";

function toMovieSource(source: WatchSource): MovieSource {
  return source === WatchSource.IMDB ? "IMDB" : "LETTERBOXD";
}

export async function getMovieSearchIndex(): Promise<MovieSearchItem[]> {
  const movies = await prisma.movie.findMany({
    orderBy: [{ year: "desc" }, { title: "asc" }],
    include: {
      genres: {
        include: {
          genre: true
        }
      },
      watches: {
        orderBy: {
          watchedDate: "desc"
        },
        take: 1
      },
      sourceMaps: {
        select: {
          source: true
        }
      }
    }
  });

  return movies.map((movie) => {
    const latestWatch = movie.watches[0];
    const sources = [
      ...new Set(movie.sourceMaps.map((sm) => toMovieSource(sm.source)))
    ];

    return {
      id: movie.id,
      title: movie.title,
      year: movie.year,
      posterUrl: movie.posterUrl,
      watched: movie.watches.length > 0,
      watchedDate: latestWatch?.watchedDate?.toISOString() ?? null,
      rating: latestWatch?.rating ?? null,
      genres: movie.genres.map(({ genre }) => genre.name),
      sources
    };
  });
}
