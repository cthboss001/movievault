import { SearchExperience } from "@/components/search-experience";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-14">
      <section className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-vault/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-vault">
          <span>✦</span>
          Personal watch history
        </p>
        <h1 className="max-w-xl text-4xl font-black leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl lg:text-6xl">
          Every movie you&apos;ve ever watched.
        </h1>
        <p className="mt-4 max-w-md text-base font-semibold text-ink/50 sm:text-lg">
          Synced from your public IMDb and Letterboxd profiles. Searchable in
          an instant.
        </p>
      </section>

      <SearchExperience />
    </main>
  );
}
