import { SearchExperience } from "@/components/search-experience";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <section className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="animate-float">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-accent shadow-[0_0_30px_rgba(45,212,191,0.25)] backdrop-blur-xl">
            <span className="text-[14px]">✦</span>
            Tazim&apos;s Movie Archive
          </p>
        </div>
        <h1 className="max-w-xl text-4xl font-black leading-[1.1] tracking-[-0.02em] text-text sm:text-5xl lg:text-6xl">
          A Lifetime of Movies.
        </h1>
        <p className="mt-5 max-w-md text-base font-medium text-muted sm:text-lg leading-relaxed">
          A searchable archive of every film I&apos;ve watched, rated, and collected across IMDb and Letterboxd.
        </p>
      </section>

      <SearchExperience />
    </main>
  );
}
