export type MovieSource = "IMDB" | "LETTERBOXD";

export type MovieSearchItem = {
  id: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  watched: boolean;
  watchedDate: string | null;
  rating: number | null;
  genres: string[];
  /** All sync sources that have this movie (e.g. IMDB, LETTERBOXD, or both) */
  sources: MovieSource[];
};

export type MovieCardData = MovieSearchItem;
