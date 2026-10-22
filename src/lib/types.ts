export interface Movie {
  id: number;
  title: string;
  overview: string;
  tagline: string;
  director: string;
  cast: string[];
  genres: string[];
  vote_average: number;
  vote_count: number;
  weighted_rating: number;
  release_date: string;
  year: string;
  runtime: number;
  imdb_id: string;
  poster_url: string | null;
}

export interface SimilarityMatch {
  id: number;
  score: number;
}

export interface WatchlistItem {
  id?: number;
  user_id?: string;
  movie_id: number;
  title: string;
  poster_url: string | null;
  genres: string[];
  director: string;
  vote_average: number;
  release_date: string;
  added_at?: string;
}

export interface MovieRating {
  movie_id: number;
  rating: number;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
}

export interface FilterState {
  searchQuery: string;
  selectedGenres: string[];
  selectedDirector: string;
  selectedCast: string;
  minRating: number;
  sortBy: "hybrid" | "rating" | "popularity" | "year";
}
