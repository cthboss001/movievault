export type MovieSearchItem = {
  id: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  watched: boolean;
  watchedDate: string | null;
  rating: number | null;
  genres: string[];
};

export type MovieCardData = MovieSearchItem;
