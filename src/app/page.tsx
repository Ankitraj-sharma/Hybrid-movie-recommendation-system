"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Movie, SimilarityMatch, FilterState } from "@/lib/types";
import { HeroBanner } from "@/components/HeroBanner";
import { FilterDrawer } from "@/components/FilterDrawer";
import { MovieCard } from "@/components/MovieCard";
import { MovieModal } from "@/components/MovieModal";
import { filterMovies, getSimilarMovies, getPersonalizedRecommendations } from "@/lib/recommendation";
import { useAuth } from "@/lib/context/AuthContext";
import { Sparkles, Film, Flame, Globe } from "lucide-react";

export default function HomePage() {
  const { watchlist } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [similarityMap, setSimilarityMap] = useState<Record<string, SimilarityMatch[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [displayCount, setDisplayCount] = useState(24);

  // Global 1M Database Search State
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [globalResults, setGlobalResults] = useState<Movie[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

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
    globalResults.forEach((m) => map.set(m.id, m));
    return map;
  }, [movies, globalResults]);

  // Handle Global 1 Million+ Movie Search via API
  useEffect(() => {
    if (!isGlobalSearch || !filters.searchQuery.trim()) {
      setGlobalResults([]);
      setIsSearchingGlobal(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingGlobal(true);
        const res = await fetch(`/api/global-search?q=${encodeURIComponent(filters.searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setGlobalResults(data.movies || []);
        }
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isGlobalSearch, filters.searchQuery]);

  // Extract unique genres
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    movies.forEach((m) => m.genres.forEach((g) => genreSet.add(g)));
    return Array.from(genreSet).sort();
  }, [movies]);

  // Hero movie pick (Oppenheimer, Dune 2, or Inception)
  const heroMovie = useMemo(() => {
    if (movies.length === 0) return null;
    return (
      movies.find((m) => m.title.toLowerCase() === "oppenheimer") ||
      movies.find((m) => m.title.toLowerCase() === "dune: part two") ||
      movies.find((m) => m.title.toLowerCase() === "inception") ||
      movies[0]
    );
  }, [movies]);

  // Filtered and Sorted movies (Local or Global)
  const filteredMovies = useMemo(() => {
    if (isGlobalSearch && filters.searchQuery.trim()) {
      return globalResults;
    }
    return filterMovies(movies, filters);
  }, [movies, filters, isGlobalSearch, globalResults]);

  // Similar movies for the active modal
  const activeSimilarMovies = useMemo(() => {
    if (!selectedMovie) return [];
    // If local match exists in similarity map
    const sim = getSimilarMovies(selectedMovie.id, similarityMap, moviesById, 10);
    if (sim.length > 0) return sim;

    // Fallback on-the-fly similarity for any global 1M movie
    const dynamicMatches: { movie: Movie; score: number }[] = [];
    for (const m of movies.slice(0, 150)) {
      if (m.id === selectedMovie.id) continue;
      let score = 0;
      if (selectedMovie.director && m.director === selectedMovie.director) score += 0.5;
      const commonG = setIntersection(selectedMovie.genres, m.genres);
      score += commonG * 0.15;
      if (score > 0) {
        dynamicMatches.push({ movie: m, score: Math.min(score, 0.95) });
      }
    }
    return dynamicMatches.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [selectedMovie, similarityMap, moviesById, movies]);

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
        <p className="text-xs text-gray-400 mt-1">Initializing 4,800+ movies & 1 Million+ global search bridge</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Showcase */}
      {!filters.searchQuery && !filters.selectedDirector && filters.selectedGenres.length === 0 && !isGlobalSearch && (
        <HeroBanner movie={heroMovie} onOpenModal={setSelectedMovie} />
      )}

      {/* Personalized AI Recommendations Section */}
      {personalizedRecs.length > 0 && !filters.searchQuery && filters.selectedGenres.length === 0 && !isGlobalSearch && (
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
        isGlobalSearch={isGlobalSearch}
        onToggleGlobalSearch={setIsGlobalSearch}
        isSearchingGlobal={isSearchingGlobal}
      />

      {/* Movies Grid Header */}
      <div className="flex items-center justify-between pb-2 border-b border-borderDark">
        <div className="flex items-center gap-2">
          {isGlobalSearch ? (
            <Globe className="w-5 h-5 text-emerald-400" />
          ) : (
            <Film className="w-5 h-5 text-accent" />
          )}
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isGlobalSearch
              ? filters.searchQuery
                ? `1 Million+ Global Results for "${filters.searchQuery}"`
                : "Search across 1 Million+ Movies (1900-2026)"
              : filters.searchQuery
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
            {isGlobalSearch
              ? "Try typing a movie name to search through the 1,000,000+ title global catalog."
              : "Try switching to '1 Million+ Global Database' search above to find any movie released up to 2026!"}
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

function setIntersection(a: string[], b: string[]) {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x)).length;
}
