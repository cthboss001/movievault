import Image from "next/image";
import type { MovieCardData } from "@/types/movie";

type MovieCardProps = {
  movie: MovieCardData;
};

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <article className="group overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="relative aspect-[2/3] bg-ink/10">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            fill
            sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-ink/45">
            No poster
          </div>
        )}
        {movie.watched ? (
          <div className="absolute left-2 top-2 rounded-md bg-vault px-2 py-1 text-xs font-black uppercase tracking-[0.08em] text-white">
            Watched
          </div>
        ) : null}
      </div>
      <div className="space-y-2 p-3">
        <div>
          <h2 className="line-clamp-2 text-base font-black leading-tight tracking-[0] text-ink">
            {movie.title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-ink/55">
            {movie.year ?? "Unknown year"}
          </p>
        </div>
        <div className="flex min-h-6 items-center justify-between gap-2 text-sm">
          <span className="truncate text-ink/60">
            {movie.genres.slice(0, 2).join(", ") || "Uncategorized"}
          </span>
          {movie.rating ? (
            <span className="shrink-0 rounded-md bg-ember/10 px-2 py-1 text-xs font-black text-ember">
              {movie.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
