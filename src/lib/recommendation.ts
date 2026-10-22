import { Movie, SimilarityMatch, FilterState } from "./types";

/**
 * Filter and sort movies based on user criteria
 */
export function filterMovies(
  movies: Movie[],
  filters: FilterState
): Movie[] {
  let result = [...movies];

  // 1. Text Search Query (Title, Director, Cast)
  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    result = result.filter((m) => {
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchDirector = m.director.toLowerCase().includes(q);
      const matchCast = m.cast.some((actor) => actor.toLowerCase().includes(q));
      const matchGenre = m.genres.some((g) => g.toLowerCase().includes(q));
      return matchTitle || matchDirector || matchCast || matchGenre;
    });
  }

  // 2. Specific Director Filter
  if (filters.selectedDirector) {
    const d = filters.selectedDirector.toLowerCase().trim();
    result = result.filter((m) => m.director.toLowerCase().includes(d));
  }

  // 3. Specific Cast / Actor Filter
  if (filters.selectedCast) {
    const c = filters.selectedCast.toLowerCase().trim();
    result = result.filter((m) =>
      m.cast.some((actor) => actor.toLowerCase().includes(c))
    );
  }

  // 4. Genres Filter (All selected genres must match)
  if (filters.selectedGenres.length > 0) {
    result = result.filter((m) =>
      filters.selectedGenres.every((g) => m.genres.includes(g))
    );
  }

  // 5. Minimum Rating Filter
  if (filters.minRating > 0) {
    result = result.filter((m) => m.vote_average >= filters.minRating);
  }

  // 6. Sorting
  switch (filters.sortBy) {
    case "rating":
      result.sort((a, b) => b.weighted_rating - a.weighted_rating);
      break;
    case "popularity":
      result.sort((a, b) => b.vote_count - a.vote_count);
      break;
    case "year":
      result.sort((a, b) => (b.year || "0").localeCompare(a.year || "0"));
      break;
    case "hybrid":
    default:
      // Hybrid sort: combines weighted rating with popular vote support
      result.sort((a, b) => {
        const scoreA = a.weighted_rating * 0.7 + Math.min(a.vote_count / 1000, 3);
        const scoreB = b.weighted_rating * 0.7 + Math.min(b.vote_count / 1000, 3);
        return scoreB - scoreA;
      });
      break;
  }

  return result;
}

/**
 * Get ML-driven similar movies using the precomputed Cosine Similarity matrix
 */
export function getSimilarMovies(
  movieId: number,
  similarityMap: Record<string, SimilarityMatch[]>,
  moviesById: Map<number, Movie>,
  limit = 10
): { movie: Movie; score: number }[] {
  const matches = similarityMap[String(movieId)] || [];
  const results: { movie: Movie; score: number }[] = [];

  for (const match of matches) {
    const movie = moviesById.get(match.id);
    if (movie) {
      results.push({ movie, score: match.score });
      if (results.length >= limit) break;
    }
  }

  return results;
}

/**
 * Generate Personalized Hybrid Recommendations based on User's Watchlist & Ratings
 */
export function getPersonalizedRecommendations(
  seedMovieIds: number[],
  similarityMap: Record<string, SimilarityMatch[]>,
  moviesById: Map<number, Movie>,
  limit = 12
): { movie: Movie; reason: string; score: number }[] {
  if (seedMovieIds.length === 0) return [];

  const seenIds = new Set(seedMovieIds);
  const candidateScores = new Map<number, { score: number; sourceTitle: string; sourceDirector: string }>();

  // Aggregate similarity scores from each movie the user liked
  for (const seedId of seedMovieIds) {
    const seedMovie = moviesById.get(seedId);
    if (!seedMovie) continue;

    const similar = similarityMap[String(seedId)] || [];
    for (const item of similar) {
      if (seenIds.has(item.id)) continue;

      const existing = candidateScores.get(item.id);
      const newScore = item.score;

      if (!existing || newScore > existing.score) {
        candidateScores.set(item.id, {
          score: (existing ? existing.score + newScore * 0.5 : newScore),
          sourceTitle: seedMovie.title,
          sourceDirector: seedMovie.director,
        });
      }
    }
  }

  // Sort candidate movies by aggregated similarity score
  const sortedCandidates = Array.from(candidateScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit);

  const recommendations: { movie: Movie; reason: string; score: number }[] = [];
  for (const [movieId, info] of sortedCandidates) {
    const movie = moviesById.get(movieId);
    if (movie) {
      const reason = info.sourceDirector
        ? `Because you liked ${info.sourceTitle} (${info.sourceDirector})`
        : `Because you liked ${info.sourceTitle}`;
      recommendations.push({
        movie,
        reason,
        score: info.score,
      });
    }
  }

  return recommendations;
}
