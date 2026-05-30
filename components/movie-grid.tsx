import { MovieCard } from "@/components/movie-card";
import type { MovieCardData } from "@/types/movie";

type MovieGridProps = {
  movies: MovieCardData[];
};

export function MovieGrid({ movies }: MovieGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
