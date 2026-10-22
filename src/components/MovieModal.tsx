"use client";

import React, { useState } from "react";
import { Movie } from "@/lib/types";
import { X, Star, Bookmark, Check, Play, Sparkles, ExternalLink, Film, User, Calendar, Clock } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
  similarMovies: { movie: Movie; score: number }[];
  onFilterByDirector?: (director: string) => void;
  onFilterByActor?: (actor: string) => void;
}

export function MovieModal({
  movie,
  onClose,
  onSelectMovie,
  similarMovies,
  onFilterByDirector,
  onFilterByActor,
}: MovieModalProps) {
  const { isWatchlisted, toggleWatchlist, rateMovie, getMovieRating } = useAuth();
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  if (!movie) return null;

  const inWatchlist = isWatchlisted(movie.id);
  const currentRating = getMovieRating(movie.id);

  const handleRating = (ratingValue: number) => {
    rateMovie(movie.id, ratingValue);
  };

  const handleTrailerClick = () => {
    const query = encodeURIComponent(`${movie.title} ${movie.year} official trailer`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-card border border-borderDark rounded-3xl overflow-hidden shadow-2xl text-white my-auto max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white p-2 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md transition border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Top Section: Poster + Metadata */}
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
            {/* Poster */}
            <div className="w-48 sm:w-56 shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl border border-borderDark bg-surface">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full aspect-[2/3] flex items-center justify-center p-4 text-center bg-surface">
                  <Film className="w-12 h-12 text-gray-600" />
                </div>
              )}
            </div>

            {/* Movie Details */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="flex items-center gap-1 bg-gold/15 border border-gold/30 text-gold text-xs font-bold px-2.5 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                  {movie.vote_average.toFixed(1)} / 10
                </span>
                <span className="text-xs text-gray-400 bg-surface px-2.5 py-1 rounded-lg border border-borderDark font-medium">
                  {movie.vote_count.toLocaleString()} votes
                </span>
                <span className="text-xs text-accent bg-accent/15 px-2.5 py-1 rounded-lg border border-accent/30 font-semibold">
                  Bayesian Score: {movie.weighted_rating}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {movie.title}
              </h2>

              {movie.tagline && (
                <p className="text-sm italic text-gray-400 mt-1">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}

              {/* Meta Chips */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 my-4">
                {movie.year && (
                  <span className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-md border border-borderDark">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {movie.release_date || movie.year}
                  </span>
                )}
                {movie.runtime > 0 && (
                  <span className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-md border border-borderDark">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                  </span>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1.5 my-3">
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs font-semibold text-gray-300 bg-surface border border-borderDark px-2.5 py-0.5 rounded-md"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Director (Clickable Filter) */}
              {movie.director && (
                <div className="my-3 text-xs sm:text-sm">
                  <span className="text-gray-400">Director: </span>
                  <button
                    onClick={() => {
                      if (onFilterByDirector) onFilterByDirector(movie.director);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 text-accent hover:underline font-semibold bg-accent/10 px-2 py-0.5 rounded border border-accent/20 ml-1"
                  >
                    <Film className="w-3 h-3" />
                    {movie.director}
                  </button>
                </div>
              )}

              {/* Top Cast (Clickable Filters) */}
              {movie.cast.length > 0 && (
                <div className="my-3 text-xs sm:text-sm">
                  <span className="text-gray-400 block mb-1.5 font-medium">Top Cast:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {movie.cast.map((actor) => (
                      <button
                        key={actor}
                        onClick={() => {
                          if (onFilterByActor) onFilterByActor(actor);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-white bg-surface hover:bg-cardHover border border-borderDark px-2 py-1 rounded-md transition"
                      >
                        <User className="w-3 h-3 text-gold" />
                        {actor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Overview */}
              <div className="my-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Synopsis
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {movie.overview || "No plot summary available."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  onClick={handleTrailerClick}
                  className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-md shadow-accent/25"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Watch Trailer
                  <ExternalLink className="w-3 h-3 text-white/80" />
                </button>

                <button
                  onClick={() => toggleWatchlist(movie)}
                  className={`flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition border ${
                    inWatchlist
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-surface hover:bg-cardHover border-borderDark text-white"
                  }`}
                >
                  {inWatchlist ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      In Watchlist
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-gold" />
                      Add to Watchlist
                    </>
                  )}
                </button>
              </div>

              {/* User Rating Bar (1 to 10 Stars) */}
              <div className="mt-5 p-3 rounded-xl bg-surface/60 border border-borderDark flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs font-medium text-gray-300">
                  Rate this movie:{" "}
                  <strong className="text-gold">
                    {currentRating > 0 ? `${currentRating}/10 Stars` : "Not rated yet"}
                  </strong>
                </span>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                    const isFilled =
                      hoverRating !== null ? star <= hoverRating : star <= currentRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => handleRating(star)}
                        className="p-0.5 text-gray-600 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            isFilled
                              ? "fill-gold text-gold"
                              : "text-gray-600 hover:text-gold"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Similar Movies by Machine Learning */}
          <div className="pt-6 border-t border-borderDark">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    ML-Powered Similar Movies
                  </h3>
                  <p className="text-xs text-gray-400">
                    Recommended via Cosine Similarity on Director, Cast & Plot Vectors
                  </p>
                </div>
              </div>
            </div>

            {similarMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {similarMovies.slice(0, 5).map(({ movie: simMovie, score }) => (
                  <div
                    key={simMovie.id}
                    onClick={() => onSelectMovie(simMovie)}
                    className="group bg-surface hover:bg-cardHover border border-borderDark rounded-xl overflow-hidden cursor-pointer transition transform hover:-translate-y-1 p-2"
                  >
                    <div className="aspect-[2/3] w-full rounded-lg overflow-hidden bg-card mb-2 relative">
                      {simMovie.poster_url ? (
                        <img
                          src={simMovie.poster_url}
                          alt={simMovie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-card text-center p-2 text-[10px] text-gray-400">
                          {simMovie.title}
                        </div>
                      )}
                      <div className="absolute top-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-400">
                        {Math.round(score * 100)}% Match
                      </div>
                    </div>
                    <h5 className="text-xs font-bold text-white truncate group-hover:text-accent">
                      {simMovie.title}
                    </h5>
                    <p className="text-[10px] text-gray-400 truncate">
                      {simMovie.director || simMovie.genres[0]}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                No similar movies indexed for this title.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
