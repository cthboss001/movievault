import { BarList } from "@/components/bar-list";
import { StatsCard } from "@/components/stats-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

type StatsResponse = {
  stats: {
    totalWatched: number;
    totalRuntimeMinutes: number;
    averageRating: number | null;
    topGenres: Array<{ name: string; count: number }>;
    watchedByYear: Array<{ year: number; count: number }>;
  };
  databaseMissing?: boolean;
};

function formatRuntime(minutes: number) {
  if (minutes === 0) return "—";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

async function fetchStats(): Promise<StatsResponse> {
  try {
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/stats`, {
      cache: "no-store"
    });

    return res.json() as Promise<StatsResponse>;
  } catch {
    return {
      stats: {
        totalWatched: 0,
        totalRuntimeMinutes: 0,
        averageRating: null,
        topGenres: [],
        watchedByYear: []
      },
      databaseMissing: false
    };
  }
}

export default async function StatsPage() {
  const { stats, databaseMissing } = await fetchStats();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-14">
      <section>
        <div className="animate-float">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-accent shadow-[0_0_30px_rgba(45,212,191,0.25)] backdrop-blur-xl">
            <span className="text-[14px]">✦</span>
            Vault analytics
          </p>
        </div>
        <h1 className="text-4xl font-black leading-[1.08] tracking-[-0.03em] text-text sm:text-5xl">
          Your watching patterns, summarized.
        </h1>
      </section>

      {databaseMissing ? (
        <div className="mt-10 rounded-xl glass-card px-5 py-6 text-sm font-semibold text-muted">
          <p className="font-black text-base text-text mb-1">🗄️ No database connected</p>
          <p>Configure a PostgreSQL database and run a sync to see your stats here.</p>
        </div>
      ) : (
        <>
          <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              label="Watched"
              value={stats.totalWatched.toLocaleString()}
              detail="Total logged movies"
            />
            <StatsCard
              label="Runtime"
              value={formatRuntime(stats.totalRuntimeMinutes)}
              detail="Known runtime only"
            />
            <StatsCard
              label="Average"
              value={stats.averageRating ? stats.averageRating.toFixed(2) : "—"}
              detail="Rating out of 5"
            />
            <StatsCard
              label="Genres"
              value={stats.topGenres.length.toLocaleString()}
              detail="Unique genres tracked"
            />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <BarList
              title="Most watched genres"
              items={stats.topGenres.map((item) => ({
                label: item.name,
                value: item.count
              }))}
            />
            <BarList
              title="Movies watched per year"
              items={stats.watchedByYear.map((item) => ({
                label: item.year.toString(),
                value: item.count
              }))}
            />
          </section>

          {stats.totalWatched === 0 && (
            <div className="mt-8 rounded-xl glass-card px-5 py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center text-accent">
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
              <p className="font-black text-text text-lg">No watch history yet.</p>
              <p className="mt-2 text-sm font-semibold text-muted">
                Head back to the{" "}
                <Link href="/" className="text-accent underline underline-offset-2">
                  search page
                </Link>{" "}
                and press <strong>Sync</strong> to import your movies.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
