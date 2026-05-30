import { prisma } from "@/lib/db";
import type { VaultStats } from "@/types/stats";

export async function getStats(): Promise<VaultStats> {
  const [watches, moviesWithRuntime, genreRows] = await Promise.all([
    prisma.watch.findMany({
      select: {
        rating: true,
        watchedDate: true
      }
    }),
    prisma.movie.findMany({
      where: {
        watches: {
          some: {}
        }
      },
      select: {
        runtimeMinutes: true
      }
    }),
    prisma.movieGenre.findMany({
      where: {
        movie: {
          watches: {
            some: {}
          }
        }
      },
      select: {
        genre: {
          select: {
            name: true
          }
        }
      }
    })
  ]);

  const totalRuntimeMinutes = moviesWithRuntime.reduce(
    (total, movie) => total + (movie.runtimeMinutes ?? 0),
    0
  );

  const ratedWatches = watches.filter((watch) => watch.rating !== null);
  const averageRating =
    ratedWatches.length === 0
      ? null
      : ratedWatches.reduce((total, watch) => total + (watch.rating ?? 0), 0) /
        ratedWatches.length;

  const genreCounts = new Map<string, number>();
  for (const row of genreRows) {
    genreCounts.set(row.genre.name, (genreCounts.get(row.genre.name) ?? 0) + 1);
  }

  const yearCounts = new Map<number, number>();
  for (const watch of watches) {
    if (!watch.watchedDate) {
      continue;
    }

    const year = watch.watchedDate.getFullYear();
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
  }

  return {
    totalWatched: moviesWithRuntime.length,
    totalRuntimeMinutes,
    averageRating,
    topGenres: [...genreCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    watchedByYear: [...yearCounts.entries()]
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year)
  };
}
