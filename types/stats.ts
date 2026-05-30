export type GenreStat = {
  name: string;
  count: number;
};

export type YearStat = {
  year: number;
  count: number;
};

export type VaultStats = {
  totalWatched: number;
  totalRuntimeMinutes: number;
  averageRating: number | null;
  topGenres: GenreStat[];
  watchedByYear: YearStat[];
};
