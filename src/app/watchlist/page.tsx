"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Movie, SimilarityMatch } from "@/lib/types";
import { MovieCard } from "@/components/MovieCard";
import { MovieModal } from "@/components/MovieModal";
import { getSimilarMovies, getPersonalizedRecommendations } from "@/lib/recommendation";
import { useAuth } from "@/lib/context/AuthContext";
import { Bookmark, Sparkles, Film, ArrowLeft } from "lucide-react";

export default function WatchlistPage() {
  const { watchlist, watchlistItems } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [similarityMap, setSimilarityMap] = useState<Record<string, SimilarityMatch[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Fetch full dataset for similarity and recommendations
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

  const moviesById = useMemo(() => {
    const map = new Map<number, Movie>();
    movies.forEach((m) => map.set(m.id, m));
    return map;
  }, [movies]);

  // Movies in watchlist converted to full Movie objects
  const watchlistedMovies = useMemo(() => {
    return watchlist
      .map((id) => moviesById.get(id))
      .filter((m): m is Movie => Boolean(m));
  }, [watchlist, moviesById]);

  // Similar movies for the active modal
  const activeSimilarMovies = useMemo(() => {
    if (!selectedMovie) return [];
    return getSimilarMovies(selectedMovie.id, similarityMap, moviesById, 10);
  }, [selectedMovie, similarityMap, moviesById]);

  // Personalized recommendations based on the watchlist
  const personalizedRecs = useMemo(() => {
    if (watchlist.length === 0 || movies.length === 0) return [];
    return getPersonalizedRecommendations(watchlist, similarityMap, moviesById, 8);
  }, [watchlist, similarityMap, moviesById, movies]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-gray-400">Loading your watchlist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-borderDark">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gold/15 text-gold flex items-center justify-center border border-gold/30">
            <Bookmark className="w-5 h-5 fill-gold" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Watchlist
            </h1>
            <p className="text-xs text-gray-400">
              {watchlistedMovies.length} {watchlistedMovies.length === 1 ? "movie" : "movies"} saved in your library
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white bg-surface hover:bg-cardHover border border-borderDark px-4 py-2.5 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discovery
        </Link>
      </div>

      {/* Watchlist Grid */}
      {watchlistedMovies.length > 0 ? (
        <div className="space-y-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
            {watchlistedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onOpenModal={setSelectedMovie}
              />
            ))}
          </div>

          {/* Personalized Recommendations derived from Watchlist */}
          {personalizedRecs.length > 0 && (
            <section className="bg-card/70 border border-borderDark/80 rounded-3xl p-6 sm:p-8 shadow-xl mt-12">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center shadow-md shadow-accent/40">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Recommended Because of Your Watchlist
                  </h2>
                  <p className="text-xs text-gray-400">
                    AI matched these titles with the directors, actors & themes of your saved movies
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
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-3xl border border-borderDark p-8">
          <div className="w-16 h-16 rounded-3xl bg-surface flex items-center justify-center mx-auto mb-4 text-gray-500">
            <Film className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Your Watchlist is Empty</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
            Explore our machine learning catalog and bookmark movies you want to watch. As you add movies, our hybrid engine will generate tailored suggestions!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-accent/25"
          >
            <Sparkles className="w-4 h-4" />
            Discover Movies Now
          </Link>
        </div>
      )}

      {/* Detail Modal */}
      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onSelectMovie={setSelectedMovie}
        similarMovies={activeSimilarMovies}
      />
    </div>
  );
}
