import { env } from "@/lib/env";
import { normalizeTitle } from "@/lib/sync/normalizers/movie";
import { prisma } from "@/lib/db";
import { WatchSource, SyncStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// Allow bookmarklets running on letterboxd.com and imdb.com to POST here
const ALLOWED_ORIGINS = [
  "https://letterboxd.com",
  "https://www.imdb.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

function corsHeaders(origin: string | null) {
  const allowed =
    origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o))
      ? origin
      : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

// Handle CORS preflight
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

type ImportedMovie = {
  title: string;
  year: number | null;
  rating: number | null;
  watchedDate: string | null;
  sourceUrl: string;
};

type ImportBody = {
  source: "letterboxd" | "imdb";
  movies: ImportedMovie[];
};

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  if (!env.DATABASE_URL) {
    return Response.json(
      { error: "DATABASE_URL not configured." },
      { status: 500, headers }
    );
  }

  let body: ImportBody;
  try {
    body = (await request.json()) as ImportBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400, headers });
  }

  const { source, movies } = body;
  if (!source || !Array.isArray(movies)) {
    return Response.json({ error: "Missing source or movies array." }, { status: 400, headers });
  }

  const prismaSource = source === "imdb" ? WatchSource.IMDB : WatchSource.LETTERBOXD;
  const now = new Date();
  let addedCount = 0;
  let updatedCount = 0;

  // Log sync run
  const syncRun = await prisma.syncRun.create({
    data: { source: prismaSource, status: SyncStatus.RUNNING }
  });

  try {
    for (const movie of movies) {
      if (!movie.title || !movie.sourceUrl) continue;

      const normalizedTitleVal = normalizeTitle(movie.title);
      const watchedDate = movie.watchedDate ? new Date(movie.watchedDate) : null;
      const sourceMovieId = extractSourceId(movie.sourceUrl, source);
      const sourceEntryId = `${source}:${sourceMovieId}`;

      const existing = await prisma.movie.findFirst({
        where: { normalizedTitle: normalizedTitleVal, year: movie.year }
      });

      let movieId: string;

      if (!existing) {
        const created = await prisma.movie.create({
          data: {
            title: movie.title,
            normalizedTitle: normalizedTitleVal,
            year: movie.year,
            lastSyncedAt: now
          }
        });
        movieId = created.id;
        addedCount++;
      } else {
        await prisma.movie.update({
          where: { id: existing.id },
          data: { lastSyncedAt: now }
        });
        movieId = existing.id;
        updatedCount++;
      }

      // Upsert source map
      await prisma.externalSourceMap.upsert({
        where: { source_sourceMovieId: { source: prismaSource, sourceMovieId } },
        update: { sourceUrl: movie.sourceUrl, movieId, lastSyncedAt: now },
        create: { source: prismaSource, sourceMovieId, sourceUrl: movie.sourceUrl, movieId, lastSyncedAt: now }
      });

      // Upsert watch record
      await prisma.watch.upsert({
        where: { source_sourceEntryId: { source: prismaSource, sourceEntryId } },
        update: { movieId, watchedDate, rating: movie.rating, sourceUrl: movie.sourceUrl, lastSyncedAt: now },
        create: { movieId, source: prismaSource, watchedDate, rating: movie.rating, sourceUrl: movie.sourceUrl, sourceEntryId, lastSyncedAt: now }
      });
    }

    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: { status: SyncStatus.SUCCESS, finishedAt: now, importedCount: addedCount, updatedCount }
    });

    return Response.json({ addedCount, updatedCount, total: movies.length }, { headers });
  } catch (error) {
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: SyncStatus.FAILED,
        finishedAt: now,
        errorMessage: error instanceof Error ? error.message : "Import error"
      }
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "Import failed." },
      { status: 500, headers }
    );
  }
}

function extractSourceId(url: string, source: string): string {
  try {
    const parsed = new URL(url);
    if (source === "imdb") {
      const m = parsed.pathname.match(/\/title\/(tt\d+)/);
      if (m) return m[1];
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts.at(-1) ?? url;
  } catch {
    return url;
  }
}
