CREATE TYPE "WatchSource" AS ENUM ('LETTERBOXD', 'IMDB');

CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "year" INTEGER,
    "overview" TEXT,
    "posterUrl" TEXT,
    "runtimeMinutes" INTEGER,
    "tmdbId" INTEGER,
    "imdbId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Watch" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "source" "WatchSource" NOT NULL,
    "watchedDate" TIMESTAMP(3),
    "rating" DOUBLE PRECISION,
    "sourceUrl" TEXT,
    "sourceEntryId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MovieGenre" (
    "movieId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "MovieGenre_pkey" PRIMARY KEY ("movieId","genreId")
);

CREATE TABLE "ExternalSourceMap" (
    "id" TEXT NOT NULL,
    "source" "WatchSource" NOT NULL,
    "sourceMovieId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "movieId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalSourceMap_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "source" "WatchSource" NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Movie_tmdbId_key" ON "Movie"("tmdbId");
CREATE UNIQUE INDEX "Movie_imdbId_key" ON "Movie"("imdbId");
CREATE INDEX "Movie_normalizedTitle_year_idx" ON "Movie"("normalizedTitle", "year");
CREATE UNIQUE INDEX "Watch_source_sourceEntryId_key" ON "Watch"("source", "sourceEntryId");
CREATE INDEX "Watch_movieId_idx" ON "Watch"("movieId");
CREATE INDEX "Watch_source_watchedDate_idx" ON "Watch"("source", "watchedDate");
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");
CREATE UNIQUE INDEX "ExternalSourceMap_source_sourceMovieId_key" ON "ExternalSourceMap"("source", "sourceMovieId");
CREATE INDEX "ExternalSourceMap_movieId_idx" ON "ExternalSourceMap"("movieId");
CREATE INDEX "SyncRun_source_startedAt_idx" ON "SyncRun"("source", "startedAt");

ALTER TABLE "Watch" ADD CONSTRAINT "Watch_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovieGenre" ADD CONSTRAINT "MovieGenre_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovieGenre" ADD CONSTRAINT "MovieGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalSourceMap" ADD CONSTRAINT "ExternalSourceMap_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
