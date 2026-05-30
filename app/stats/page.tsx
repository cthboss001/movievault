import { BarList } from "@/components/bar-list";
import { StatsCard } from "@/components/stats-card";
import { getStats } from "@/lib/stats/get-stats";

export const dynamic = "force-dynamic";

function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export default async function StatsPage() {
  const stats = await getStats();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pt-12">
      <section>
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-ember">
          Vault analytics
        </p>
        <h1 className="text-4xl font-black tracking-[0] text-ink sm:text-5xl">
          Your watching patterns, summarized.
        </h1>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Watched"
          value={stats.totalWatched.toLocaleString()}
          detail="Total logged watches"
        />
        <StatsCard
          label="Runtime"
          value={formatRuntime(stats.totalRuntimeMinutes)}
          detail="Known runtime only"
        />
        <StatsCard
          label="Average"
          value={stats.averageRating ? stats.averageRating.toFixed(2) : "-"}
          detail="Based on rated watches"
        />
        <StatsCard
          label="Genres"
          value={stats.topGenres.length.toLocaleString()}
          detail="Genres in your vault"
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
    </main>
  );
}
