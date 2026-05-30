"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { MovieGrid } from "@/components/movie-grid";
import type { MovieSearchItem } from "@/types/movie";

type MoviesResponse = {
  movies: MovieSearchItem[];
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

export function SearchExperience() {
  const [movies, setMovies] = useState<MovieSearchItem[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "success" | "error"
  >("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  async function loadMovies() {
    const response = await fetch("/api/movies");

    if (!response.ok) {
      throw new Error("Failed to load movies.");
    }

    const data = (await response.json()) as MoviesResponse;
    setMovies(data.movies);
    setStatus("ready");
  }

  useEffect(() => {
    let active = true;

    async function loadInitialMovies() {
      try {
        const response = await fetch("/api/movies");

        if (!response.ok) {
          throw new Error("Failed to load movies.");
        }

        const data = (await response.json()) as MoviesResponse;
        if (active) {
          setMovies(data.movies);
          setStatus("ready");
        }
      } catch {
        if (active) {
          setStatus("error");
        }
      }
    }

    loadInitialMovies();

    return () => {
      active = false;
    };
  }, []);

  async function handleSync() {
    setSyncStatus("syncing");
    setSyncMessage("Syncing IMDb and Letterboxd...");

    try {
      const response = await fetch("/api/sync", {
        method: "POST"
      });
      const data = (await parseJsonResponse(response)) as SyncResponse;

      if (!response.ok || !data.result) {
        throw new Error(data.error ?? "Sync failed.");
      }

      const warningText = Object.entries(data.result.sourceErrors)
        .map(([source, message]) => `${source}: ${message}`)
        .join(" ");

      setSyncStatus("success");
      setSyncMessage(
        `Synced ${data.result.syncedCount} movies. Added ${data.result.addedCount}, updated ${data.result.updatedCount}, skipped ${data.result.skippedCount}.` +
          (warningText ? ` Warning: ${warningText}` : "")
      );

      await loadMovies();
    } catch (error) {
      setSyncStatus("error");
      setSyncMessage(error instanceof Error ? error.message : "Sync failed.");
    }
  }

  const fuse = useMemo(
    () =>
      new Fuse(movies, {
        keys: [
          { name: "title", weight: 0.72 },
          { name: "genres", weight: 0.2 },
          { name: "year", weight: 0.08 }
        ],
        threshold: 0.35,
        includeScore: true,
        ignoreLocation: true,
        minMatchCharLength: 2
      }),
    [movies]
  );

  const visibleMovies = useMemo(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return movies.slice(0, 25);
    }

    return fuse.search(trimmedQuery).map((result) => result.item);
  }, [fuse, movies, query]);

  return (
    <section className="mx-auto mt-8 w-full max-w-5xl sm:mt-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
        <label htmlFor="movie-search" className="sr-only">
          Search watched movies
        </label>
        <input
          id="movie-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Fight Club, drama, 1999..."
          className="h-14 w-full rounded-lg border border-ink/10 bg-white px-5 text-lg font-semibold text-ink shadow-soft outline-none transition placeholder:text-ink/35 focus:border-vault focus:ring-4 focus:ring-vault/15"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleSync}
          disabled={syncStatus === "syncing"}
          className="h-14 shrink-0 rounded-lg bg-vault px-6 text-sm font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:bg-vault/90 disabled:cursor-not-allowed disabled:bg-ink/30 sm:w-32"
        >
          {syncStatus === "syncing" ? "Syncing" : "Sync"}
        </button>
      </div>

      {syncMessage ? (
        <div
          className={[
            "mx-auto mt-4 max-w-2xl rounded-lg border px-4 py-3 text-sm font-semibold",
            syncStatus === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-vault/20 bg-white text-ink/70"
          ].join(" ")}
        >
          {syncMessage}
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3 text-sm font-semibold text-ink/60">
        <p>
          {status === "loading"
            ? "Loading your vault..."
            : `${visibleMovies.length} of ${movies.length} movies`}
        </p>
        {query ? <p>Searching for &quot;{query}&quot;</p> : null}
      </div>

      <div className="mt-4">
        {status === "error" ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-sm font-semibold text-red-700">
            MovieVault could not load movies. Check your database connection and
            run the initial sync or seed script.
          </div>
        ) : null}

        {status !== "error" && visibleMovies.length > 0 ? (
          <MovieGrid movies={visibleMovies} />
        ) : null}

        {status === "ready" && visibleMovies.length === 0 ? (
          <div className="rounded-lg border border-ink/10 bg-white px-4 py-8 text-center">
            <p className="text-lg font-black text-ink">No matches found.</p>
            <p className="mt-2 text-sm font-semibold text-ink/55">
              Try a title fragment, genre, or release year.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      error: text
    };
  }
}
