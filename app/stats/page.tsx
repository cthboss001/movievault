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
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-ember/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-ember">
          <span>📊</span>
          Vault analytics
        </p>
        <h1 className="text-4xl font-black leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl">
          Your watching patterns, summarized.
        </h1>
      </section>

      {databaseMissing ? (
        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 px-5 py-6 text-sm font-semibold text-amber-800">
          <p className="font-black text-base mb-1">🗄️ No database connected</p>
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
            <div className="mt-8 rounded-xl border border-ink/8 bg-white px-5 py-10 text-center">
              <p className="text-3xl mb-3">🎬</p>
              <p className="font-black text-ink text-lg">No watch history yet.</p>
              <p className="mt-2 text-sm font-semibold text-ink/50">
                Head back to the{" "}
                <Link href="/" className="text-vault underline underline-offset-2">
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
