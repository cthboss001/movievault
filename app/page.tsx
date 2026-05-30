import { SearchExperience } from "@/components/search-experience";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pt-12">
      <section className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-ember">
          Personal watch history
        </p>
        <h1 className="max-w-2xl text-4xl font-black tracking-[0] text-ink sm:text-6xl">
          Find any movie you have watched.
        </h1>
      </section>
      <SearchExperience />
    </main>
  );
}
