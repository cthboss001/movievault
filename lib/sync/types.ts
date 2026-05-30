export type PublicMovieSource = "imdb" | "letterboxd";

export type NormalizedMovie = {
  title: string;
  year: number | null;
  rating: number | null;
  watchedDate: Date | null;
  source: PublicMovieSource;
  sourceUrl: string;
};

export type SyncSourceAdapter = {
  source: PublicMovieSource;
  fetchMovies(): Promise<NormalizedMovie[]>;
};

export type SyncResult = {
  syncedCount: number;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  sourceCounts: Record<PublicMovieSource, number>;
  sourceErrors: Partial<Record<PublicMovieSource, string>>;
};
