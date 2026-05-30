import { prisma } from "@/lib/db";
import type { MovieSearchItem } from "@/types/movie";

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
      }
    }
  });

  return movies.map((movie) => {
    const latestWatch = movie.watches[0];

    return {
      id: movie.id,
      title: movie.title,
      year: movie.year,
      posterUrl: movie.posterUrl,
      watched: movie.watches.length > 0,
      watchedDate: latestWatch?.watchedDate?.toISOString() ?? null,
      rating: latestWatch?.rating ?? null,
      genres: movie.genres.map(({ genre }) => genre.name)
    };
  });
}
