import { SyncStatus, WatchSource } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeTitle } from "@/lib/sync/normalizers/movie";
import type {
  NormalizedMovie,
  PublicMovieSource,
  SyncResult,
  SyncSourceAdapter
} from "@/lib/sync/types";

type MovieGroup = {
  title: string;
  normalizedTitle: string;
  year: number | null;
  records: NormalizedMovie[];
};

type UpsertStatus = "added" | "updated" | "skipped";
type ExistingSyncedMovie = {
  title: string;
  lastSyncedAt: Date | null;
  watches: Array<{
    source: WatchSource;
    sourceEntryId: string | null;
    rating: number | null;
    watchedDate: Date | null;
    sourceUrl: string | null;
  }>;
  sourceMaps: Array<{
    source: WatchSource;
    sourceMovieId: string;
    sourceUrl: string | null;
  }>;
};

export async function runPublicProfileSync(
  providers: SyncSourceAdapter[]
): Promise<SyncResult> {
  const fetchedMovies: NormalizedMovie[] = [];
  const sourceCounts = {
    imdb: 0,
    letterboxd: 0
  } satisfies Record<PublicMovieSource, number>;
  const sourceErrors: Partial<Record<PublicMovieSource, string>> = {};

  for (const provider of providers) {
    const syncRun = await prisma.syncRun.create({
      data: {
        source: toPrismaSource(provider.source),
        status: SyncStatus.RUNNING
      }
    });

    try {
      const movies = await provider.fetchMovies();
      fetchedMovies.push(...movies);
      sourceCounts[provider.source] = movies.length;

      await prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          status: SyncStatus.SUCCESS,
          finishedAt: new Date(),
          importedCount: movies.length
        }
      });
    } catch (error) {
      await prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          status: SyncStatus.FAILED,
          finishedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown sync error"
        }
      });

      sourceErrors[provider.source] =
        error instanceof Error ? error.message : "Unknown sync error";
    }
  }

  const groups = groupMovies(fetchedMovies);
  const result: SyncResult = {
    syncedCount: groups.length,
    addedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    sourceCounts,
    sourceErrors
  };

  for (const group of groups) {
    const status = await upsertMovieGroup(group);

    if (status === "added") {
      result.addedCount += 1;
    } else if (status === "updated") {
      result.updatedCount += 1;
    } else {
      result.skippedCount += 1;
    }
  }

  return result;
}

function groupMovies(movies: NormalizedMovie[]): MovieGroup[] {
  const groups = new Map<string, MovieGroup>();

  for (const movie of movies) {
    const normalizedTitle = normalizeTitle(movie.title);
    const key = `${normalizedTitle}:${movie.year ?? "unknown"}`;
    const existing = groups.get(key);

    if (existing) {
      existing.records.push(movie);
      existing.title = chooseTitle(existing.title, movie.title);
      continue;
    }

    groups.set(key, {
      title: movie.title,
      normalizedTitle,
      year: movie.year,
      records: [movie]
    });
  }

  return [...groups.values()];
}

async function upsertMovieGroup(group: MovieGroup): Promise<UpsertStatus> {
  const now = new Date();
  const existingMovie = await prisma.movie.findFirst({
    where: {
      normalizedTitle: group.normalizedTitle,
      year: group.year
    },
    include: {
      watches: true,
      sourceMaps: true
    }
  });

  if (!existingMovie) {
    const movie = await prisma.movie.create({
      data: {
        title: group.title,
        normalizedTitle: group.normalizedTitle,
        year: group.year,
        lastSyncedAt: now
      }
    });

    for (const record of group.records) {
      await upsertSourceRecord(movie.id, record, now);
    }

    return "added";
  }

  const changed =
    existingMovie.title !== group.title ||
    existingMovie.lastSyncedAt === null ||
    group.records.some((record) => sourceRecordChanged(existingMovie, record));

  await prisma.movie.update({
    where: { id: existingMovie.id },
    data: {
      title: group.title,
      lastSyncedAt: now
    }
  });

  for (const record of group.records) {
    await upsertSourceRecord(existingMovie.id, record, now);
  }

  return changed ? "updated" : "skipped";
}

async function upsertSourceRecord(
  movieId: string,
  record: NormalizedMovie,
  syncedAt: Date
) {
  const source = toPrismaSource(record.source);
  const sourceMovieId = getSourceMovieId(record);
  const sourceEntryId = `${record.source}:${sourceMovieId}`;

  await prisma.externalSourceMap.upsert({
    where: {
      source_sourceMovieId: {
        source,
        sourceMovieId
      }
    },
    update: {
      sourceUrl: record.sourceUrl,
      movieId,
      lastSyncedAt: syncedAt
    },
    create: {
      source,
      sourceMovieId,
      sourceUrl: record.sourceUrl,
      movieId,
      lastSyncedAt: syncedAt
    }
  });

  await prisma.watch.upsert({
    where: {
      source_sourceEntryId: {
        source,
        sourceEntryId
      }
    },
    update: {
      movieId,
      watchedDate: record.watchedDate,
      rating: record.rating,
      sourceUrl: record.sourceUrl,
      lastSyncedAt: syncedAt
    },
    create: {
      movieId,
      source,
      watchedDate: record.watchedDate,
      rating: record.rating,
      sourceUrl: record.sourceUrl,
      sourceEntryId,
      lastSyncedAt: syncedAt
    }
  });
}

function sourceRecordChanged(movie: ExistingSyncedMovie, record: NormalizedMovie) {
  const source = toPrismaSource(record.source);
  const sourceMovieId = getSourceMovieId(record);
  const sourceEntryId = `${record.source}:${sourceMovieId}`;
  const watch = movie.watches.find(
    (item) => item.source === source && item.sourceEntryId === sourceEntryId
  );
  const sourceMap = movie.sourceMaps.find(
    (item) => item.source === source && item.sourceMovieId === sourceMovieId
  );

  if (!watch || !sourceMap) {
    return true;
  }

  return (
    watch.rating !== record.rating ||
    watch.sourceUrl !== record.sourceUrl ||
    watch.watchedDate?.getTime() !== record.watchedDate?.getTime()
  );
}

function toPrismaSource(source: PublicMovieSource) {
  return source === "imdb" ? WatchSource.IMDB : WatchSource.LETTERBOXD;
}

function getSourceMovieId(record: NormalizedMovie) {
  const url = new URL(record.sourceUrl);
  const imdbMatch = url.pathname.match(/\/title\/(tt\d+)/);

  if (imdbMatch) {
    return imdbMatch[1];
  }

  const parts = url.pathname.split("/").filter(Boolean);
  return parts.at(-1) ?? `${normalizeTitle(record.title)}-${record.year ?? "unknown"}`;
}

function chooseTitle(current: string, candidate: string) {
  if (candidate.length > current.length && !candidate.includes("...")) {
    return candidate;
  }

  return current;
}
