import Image from "next/image";
import type { MovieCardData, MovieSource } from "@/types/movie";

type MovieCardProps = {
  movie: MovieCardData;
};

function SourceBadge({ source }: { source: MovieSource }) {
  const isImdb = source === "IMDB";
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.06em] text-text",
      ].join(" ")}
      title={isImdb ? "IMDb" : "Letterboxd"}
    >
      {isImdb ? "IMDb" : "LBD"}
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push("★");
    } else if (i === full && half) {
      stars.push("½");
    } else {
      stars.push("☆");
    }
  }

  return (
    <span className="text-[11px] text-accent tracking-[-0.02em]" title={`${rating} / 5`}>
      {stars.join("")}
    </span>
  );
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <article className="group flex flex-col gap-2 transition-all duration-200 cursor-pointer">
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-surface-2 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            fill
            sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-muted/30"
            >
              <rect x="2" y="2" width="20" height="20" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span className="text-xs font-semibold text-muted/50">No poster</span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        {/* Source badges — top right */}
        {movie.sources.length > 0 && (
          <div className="absolute right-2 top-2 flex flex-col gap-1">
            {movie.sources.map((source) => (
              <SourceBadge key={source} source={source} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-1">
        <div>
          <h2 className="line-clamp-2 text-sm font-black leading-tight tracking-[0] text-text transition-colors group-hover:text-accent-hover">
            {movie.title}
          </h2>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted">
              {movie.year ?? "Year unknown"}
            </p>
            {movie.rating ? (
              <div className="flex shrink-0 items-center gap-1">
                <StarRating rating={movie.rating} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
