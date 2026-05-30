"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { MovieGrid } from "@/components/movie-grid";
import type { MovieSearchItem, MovieSource } from "@/types/movie";

type MoviesResponse = {
  movies: MovieSearchItem[];
  databaseMissing?: boolean;
  error?: string;
};

type SyncSourceResult = {
  count: number;
  error?: string;
};

type SyncResponse = {
  result?: {
    syncedCount: number;
    addedCount: number;
    updatedCount: number;
    skippedCount: number;
    sourceCounts: {
      imdb: number;
      letterboxd: number;
    };
    sourceErrors: Partial<Record<"imdb" | "letterboxd", string>>;
  };
  error?: string;
};

type SourceFilter = "ALL" | MovieSource;
type RatingFilter = "ALL" | "RATED" | "UNRATED";

// ── Small UI atoms ────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-150",
        active
          ? "bg-accent text-background shadow-[0_0_12px_rgba(45,212,191,0.2)]"
          : "bg-surface-2 text-muted hover:text-text hover:bg-border/50"
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      <div className="aspect-[2/3] w-full rounded-xl bg-surface-2" />
      <div className="h-3 w-3/4 rounded bg-surface-2" />
      <div className="h-2 w-1/3 rounded bg-border" />
    </div>
  );
}

function SetupBanner() {
  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-900">
      <p className="font-black text-base mb-2">🗄️ Database not configured yet</p>
      <p className="font-semibold text-amber-800 mb-3">
        To start using MovieVault, connect a PostgreSQL database:
      </p>
      <ol className="list-decimal list-inside space-y-1.5 font-semibold text-amber-800">
        <li>
          Create a <code className="bg-amber-100 rounded px-1 font-mono text-xs">.env</code> file
          in the project root
        </li>
        <li>
          Add:{" "}
          <code className="bg-amber-100 rounded px-1 font-mono text-xs">
            DATABASE_URL=&quot;postgresql://USER:PASS@HOST:5432/movievault&quot;
          </code>
        </li>
        <li>
          Run:{" "}
          <code className="bg-amber-100 rounded px-1 font-mono text-xs">
            npm run prisma:migrate
          </code>
        </li>
        <li>Restart the dev server, then press the Sync button above.</li>
      </ol>
    </div>
  );
}

function SyncResultBanner({
  status,
  message,
  sourceResults
}: {
  status: "idle" | "success" | "error" | "syncing";
  message: string | null;
  sourceResults?: { imdb: SyncSourceResult; letterboxd: SyncSourceResult };
}) {
  if (!message && status !== "syncing") return null;

  if (status === "syncing") {
    return (
      <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-vault/20 bg-white px-4 py-3 flex items-center gap-3">
        <span className="inline-block h-4 w-4 rounded-full border-2 border-vault border-t-transparent animate-spin" />
        <span className="text-sm font-semibold text-ink/70">
          Fetching movies from IMDb and Letterboxd…
        </span>
      </div>
    );
  }

  const isError = status === "error";
  return (
    <div
      className={[
        "mx-auto mt-4 max-w-2xl rounded-xl border px-4 py-3",
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-vault/20 bg-white text-ink/70"
      ].join(" ")}
    >
      <p className="text-sm font-semibold">{message}</p>
      {sourceResults && !isError && (
        <div className="mt-2 flex flex-wrap gap-3">
          {(["imdb", "letterboxd"] as const).map((src) => {
            const res = sourceResults[src];
            const label = src === "imdb" ? "IMDb" : "Letterboxd";
            return res.error ? (
              <span
                key={src}
                className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600"
                title={res.error}
              >
                {label}: failed
              </span>
            ) : (
              <span
                key={src}
                className="rounded-full bg-vault/10 px-2.5 py-0.5 text-xs font-bold text-vault"
              >
                {label}: {res.count} movies
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SearchExperience() {
  const [movies, setMovies] = useState<MovieSearchItem[]>([]);
  const [query, setQuery] = useState("");
  const [loadStatus, setLoadStatus] = useState<
    "loading" | "ready" | "error" | "no-database"
  >("loading");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Filters
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("ALL");

  const searchInputRef = useRef<HTMLInputElement>(null);

  async function loadMovies() {
    const response = await fetch("/api/movies");
    const data = (await response.json()) as MoviesResponse;

    if (data.databaseMissing) {
      setLoadStatus("no-database");
      return;
    }

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to load movies.");
    }

    setMovies(data.movies);
    setLoadStatus("ready");
  }

  useEffect(() => {
    let active = true;

    async function boot() {
      try {
        const response = await fetch("/api/movies");
        const data = (await response.json()) as MoviesResponse;

        if (!active) return;

        if (data.databaseMissing) {
          setLoadStatus("no-database");
          return;
        }

        if (!response.ok) {
          setLoadStatus("error");
          return;
        }

        setMovies(data.movies);
        setLoadStatus("ready");
      } catch {
        if (active) setLoadStatus("error");
      }
    }

    boot();
    return () => {
      active = false;
    };
  }, []);

  // Fuse.js index
  const fuse = useMemo(
    () =>
      new Fuse(movies, {
        keys: [
          { name: "title", weight: 0.72 },
          { name: "genres", weight: 0.15 },
          { name: "year", weight: 0.13 }
        ],
        threshold: 0.35,
        includeScore: true,
        ignoreLocation: true,
        minMatchCharLength: 2
      }),
    [movies]
  );

  // Apply text search + filters + sorting
  const visibleMovies = useMemo(() => {
    const trimmedQuery = query.trim();
    // If not searching, we must spread movies into a new array so we can sort it.
    let results = trimmedQuery ? fuse.search(trimmedQuery).map((r) => r.item) : [...movies];

    // Source filter
    if (sourceFilter !== "ALL") {
      results = results.filter((m) => m.sources.includes(sourceFilter));
    }

    // Rating filter
    if (ratingFilter === "RATED") {
      results = results.filter((m) => m.rating !== null);
    } else if (ratingFilter === "UNRATED") {
      results = results.filter((m) => m.rating === null);
    }

    // Apply visual sorting only if not actively searching
    if (!trimmedQuery) {
      results.sort((a, b) => {
        const aHasPoster = !!a.posterUrl;
        const bHasPoster = !!b.posterUrl;
        
        // If one has a poster and the other doesn't, the one with the poster comes first.
        if (aHasPoster && !bHasPoster) return -1;
        if (!aHasPoster && bHasPoster) return 1;
        
        // Otherwise, maintain their relative order
        return 0;
      });
    }

    return results;
  }, [fuse, movies, query, sourceFilter, ratingFilter]);

  const hasActiveFilters =
    query.trim() !== "" || sourceFilter !== "ALL" || ratingFilter !== "ALL";

  const imdbCount = movies.filter((m) => m.sources.includes("IMDB")).length;
  const lbdCount = movies.filter((m) => m.sources.includes("LETTERBOXD")).length;

  return (
    <section className="mx-auto mt-8 w-full max-w-5xl sm:mt-10">
      {/* Search + Sync bar */}
      <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
        <label htmlFor="movie-search" className="sr-only">
          Search watched movies
        </label>
        <input
          id="movie-search"
          ref={searchInputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Fight Club, drama, 1999…"
          className="h-16 w-full rounded-2xl border border-transparent bg-surface-2 px-6 text-lg font-medium text-text shadow-sm outline-none transition-all placeholder:text-muted/60 focus:border-accent focus:shadow-[0_0_20px_rgba(45,212,191,0.15)] focus:bg-surface"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {/* Filters row */}
      {loadStatus === "ready" && (
        <div className="mx-auto mt-5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted/60">
              Source
            </span>
            <FilterChip
              label="All"
              active={sourceFilter === "ALL"}
              onClick={() => setSourceFilter("ALL")}
            />
            <FilterChip
              label={`IMDb${imdbCount > 0 ? ` (${imdbCount})` : ""}`}
              active={sourceFilter === "IMDB"}
              onClick={() => setSourceFilter("IMDB")}
            />
            <FilterChip
              label={`Letterboxd${lbdCount > 0 ? ` (${lbdCount})` : ""}`}
              active={sourceFilter === "LETTERBOXD"}
              onClick={() => setSourceFilter("LETTERBOXD")}
            />
            <span className="ml-2 text-xs font-bold uppercase tracking-wider text-muted/60">
              Rating
            </span>
            <FilterChip
              label="Any"
              active={ratingFilter === "ALL"}
              onClick={() => setRatingFilter("ALL")}
            />
            <FilterChip
              label="Rated"
              active={ratingFilter === "RATED"}
              onClick={() => setRatingFilter("RATED")}
            />
            <FilterChip
              label="Unrated"
              active={ratingFilter === "UNRATED"}
              onClick={() => setRatingFilter("UNRATED")}
            />
          </div>
        </div>
      )}

      {/* Count row */}
      <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-muted">
        <p>
          {loadStatus === "loading"
            ? "Loading your vault…"
            : loadStatus === "no-database"
              ? "No database connected"
              : loadStatus === "error"
                ? "Could not load movies"
                : hasActiveFilters
                  ? `${visibleMovies.length} of ${movies.length} movies`
                  : `${movies.length} movies in vault`}
        </p>
        {lastSyncedAt ? (
          <p>
            Last synced:{" "}
            {new Date(lastSyncedAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        ) : null}
      </div>

      {/* Content area */}
      <div className="mt-4">
        {/* Loading skeletons */}
        {loadStatus === "loading" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* No database */}
        {loadStatus === "no-database" && <SetupBanner />}

        {/* DB error */}
        {loadStatus === "error" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-5 text-sm font-semibold text-red-700">
            <p className="font-black text-base mb-1">⚠️ Could not connect to the database</p>
            <p>
              Check that <code className="font-mono text-xs bg-red-100 rounded px-1">DATABASE_URL</code> is set
              correctly in your <code className="font-mono text-xs bg-red-100 rounded px-1">.env</code> file
              and the migration has been applied.
            </p>
          </div>
        )}

        {/* Movies grid */}
        {loadStatus === "ready" && visibleMovies.length > 0 && (
          <MovieGrid movies={visibleMovies} />
        )}

        {/* Empty state after sync */}
        {loadStatus === "ready" && visibleMovies.length === 0 && movies.length === 0 && (
          <div className="rounded-xl glass-card px-5 py-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-accent">
              <svg 
                viewBox="0 0 24 24" 
                width="32" 
                height="32" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="animate-[spin_12s_linear_infinite]"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="9" />
                <line x1="12" y1="15" x2="12" y2="22" />
                <line x1="2" y1="12" x2="9" y2="12" />
                <line x1="15" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <p className="text-lg font-black text-text">Your vault is empty.</p>
            <p className="mt-2 text-sm font-semibold text-muted">
              Head to the <strong>Import</strong> page to add your movies from IMDb and Letterboxd.
            </p>
          </div>
        )}

        {/* No search results */}
        {loadStatus === "ready" && visibleMovies.length === 0 && movies.length > 0 && (
          <div className="rounded-xl glass-card px-5 py-8 text-center">
            <p className="text-lg font-black text-text">No matches found.</p>
            <p className="mt-2 text-sm font-semibold text-muted">
              Try a different title, genre, or release year — or clear your filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSourceFilter("ALL");
                  setRatingFilter("ALL");
                  searchInputRef.current?.focus();
                }}
                className="mt-4 rounded-full bg-surface-2 px-4 py-2 text-xs font-black text-text hover:bg-border transition shadow-sm"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
}
