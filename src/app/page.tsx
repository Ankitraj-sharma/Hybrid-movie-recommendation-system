"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Movie, SimilarityMatch, FilterState } from "@/lib/types";
import { HeroBanner } from "@/components/HeroBanner";
import { FilterDrawer } from "@/components/FilterDrawer";
import { MovieCard } from "@/components/MovieCard";
import { MovieModal } from "@/components/MovieModal";
import { filterMovies, getSimilarMovies, getPersonalizedRecommendations } from "@/lib/recommendation";
import { useAuth } from "@/lib/context/AuthContext";
import { Sparkles, Film, Flame } from "lucide-react";

export default function HomePage() {
  const { watchlist } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [similarityMap, setSimilarityMap] = useState<Record<string, SimilarityMatch[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [displayCount, setDisplayCount] = useState(24);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    selectedGenres: [],
    selectedDirector: "",
    selectedCast: "",
    minRating: 0,
    sortBy: "hybrid",
  });

  // Fetch precomputed datasets
  useEffect(() => {
    async function loadDataset() {
      try {
        const [moviesRes, simRes] = await Promise.all([
          fetch("/data/movies.json"),
          fetch("/data/similarity.json"),
        ]);
        const moviesData: Movie[] = await moviesRes.json();
        const simData: Record<string, SimilarityMatch[]> = await simRes.json();
        setMovies(moviesData);
        setSimilarityMap(simData);
      } catch (err) {
        console.error("Error loading movie dataset:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDataset();
  }, []);

  // Map for O(1) movie lookup
  const moviesById = useMemo(() => {
    const map = new Map<number, Movie>();
    movies.forEach((m) => map.set(m.id, m));
    return map;
  }, [movies]);

  // Extract unique genres
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    movies.forEach((m) => m.genres.forEach((g) => genreSet.add(g)));
    return Array.from(genreSet).sort();
  }, [movies]);

  // Hero movie pick (Inception or top rated)
  const heroMovie = useMemo(() => {
    if (movies.length === 0) return null;
    return (
      movies.find((m) => m.title.toLowerCase() === "inception") ||
      movies.find((m) => m.title.toLowerCase() === "the dark knight") ||
      movies[0]
    );
  }, [movies]);

  // Filtered and Sorted movies
  const filteredMovies = useMemo(() => {
    return filterMovies(movies, filters);
  }, [movies, filters]);

  // Similar movies for the active modal
  const activeSimilarMovies = useMemo(() => {
    if (!selectedMovie) return [];
    return getSimilarMovies(selectedMovie.id, similarityMap, moviesById, 10);
  }, [selectedMovie, similarityMap, moviesById]);

  // Personalized Recommendations derived from user's Watchlist
  const personalizedRecs = useMemo(() => {
    if (watchlist.length === 0 || movies.length === 0) return [];
    return getPersonalizedRecommendations(watchlist, similarityMap, moviesById, 8);
  }, [watchlist, similarityMap, moviesById, movies]);

  const handleFilterByDirector = (dir: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedDirector: dir,
    }));
  };

  const handleFilterByActor = (actor: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedCast: actor,
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-lg font-bold text-white">Loading Movie Database & ML Embeddings...</h3>
        <p className="text-xs text-gray-400 mt-1">Initializing 4,800+ movies & cosine similarity vectors</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Showcase */}
      {!filters.searchQuery && !filters.selectedDirector && filters.selectedGenres.length === 0 && (
        <HeroBanner movie={heroMovie} onOpenModal={setSelectedMovie} />
      )}

      {/* Personalized AI Recommendations Section (Shows when user has items in watchlist) */}
      {personalizedRecs.length > 0 && !filters.searchQuery && filters.selectedGenres.length === 0 && (
        <section className="bg-card/70 border border-borderDark/80 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center shadow-md shadow-accent/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Recommended For You (AI Personalized)
              </h2>
              <p className="text-xs text-gray-400">
                Generated from your watchlist preferences using Cosine Similarity on Directors, Cast & Themes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {personalizedRecs.map(({ movie, reason }) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onOpenModal={setSelectedMovie}
                recommendationReason={reason}
              />
            ))}
          </div>
        </section>
      )}

      {/* Interactive Multi-Facet Filter Drawer */}
      <FilterDrawer
        filters={filters}
        onFilterChange={setFilters}
        totalFiltered={filteredMovies.length}
        availableGenres={availableGenres}
      />

      {/* Movies Grid Header */}
      <div className="flex items-center justify-between pb-2 border-b border-borderDark">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            {filters.searchQuery
              ? `Results for "${filters.searchQuery}"`
              : filters.selectedDirector
              ? `Movies directed by ${filters.selectedDirector}`
              : filters.selectedCast
              ? `Movies starring ${filters.selectedCast}`
              : "Explore Catalog & Recommendations"}
          </h2>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          Showing {Math.min(displayCount, filteredMovies.length)} of {filteredMovies.length}
        </span>
      </div>

      {/* Main Movies Grid */}
      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {filteredMovies.slice(0, displayCount).map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onOpenModal={setSelectedMovie}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-2xl border border-borderDark">
          <Flame className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Movies Match Your Search Criteria</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your director, cast, genre filters or lower the minimum rating threshold.
          </p>
        </div>
      )}

      {/* Load More Button */}
      {displayCount < filteredMovies.length && (
        <div className="text-center pt-6">
          <button
            onClick={() => setDisplayCount((prev) => prev + 24)}
            className="bg-surface hover:bg-cardHover border border-borderDark text-white text-sm font-semibold px-8 py-3 rounded-xl transition hover:border-gray-500 shadow-md"
          >
            Load More Movies ({filteredMovies.length - displayCount} remaining)
          </button>
        </div>
      )}

      {/* Detail & Recommendation Modal */}
      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onSelectMovie={setSelectedMovie}
        similarMovies={activeSimilarMovies}
        onFilterByDirector={handleFilterByDirector}
        onFilterByActor={handleFilterByActor}
      />
    </div>
  );
}
