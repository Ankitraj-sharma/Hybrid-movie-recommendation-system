"use client";

import React from "react";
import { Movie } from "@/lib/types";
import { Star, Bookmark, Check, Sparkles, Play } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

interface HeroBannerProps {
  movie: Movie | null;
  onOpenModal: (movie: Movie) => void;
}

export function HeroBanner({ movie, onOpenModal }: HeroBannerProps) {
  const { isWatchlisted, toggleWatchlist } = useAuth();

  if (!movie) return null;

  const inWatchlist = isWatchlisted(movie.id);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-card border border-borderDark/80 shadow-2xl mb-10">
      {/* Background Poster Artwork with Cinematic Overlay */}
      <div className="absolute inset-0 z-0">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover object-top opacity-30 filter blur-sm scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-red-950/40 via-card to-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/70 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row gap-8 items-center">
        {/* Poster Thumbnail */}
        <div className="w-48 sm:w-56 md:w-64 shrink-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-borderDark/80 group">
          {movie.poster_url ? (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full h-auto object-cover transform group-hover:scale-105 transition duration-500"
              onError={(e) => {
                // Fallback to stylized SVG placeholder if image network error
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full aspect-[2/3] bg-surface flex flex-col items-center justify-center p-4 text-center">
              <span className="text-xl font-bold text-gray-300">{movie.title}</span>
              <span className="text-xs text-accent mt-2">{movie.director}</span>
            </div>
          )}
        </div>

        {/* Movie Info */}
        <div className="flex-1 text-center md:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            AI Spotlight Pick • Hybrid Score: {movie.weighted_rating}/10
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {movie.title}
          </h1>

          {/* Meta Details */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs sm:text-sm text-gray-300 my-3">
            <span className="flex items-center gap-1.5 text-gold font-bold bg-gold/10 px-2.5 py-1 rounded-lg border border-gold/30">
              <Star className="w-4 h-4 fill-gold text-gold" />
              {movie.vote_average.toFixed(1)} IMDb
            </span>

            {movie.year && (
              <span className="bg-surface px-2.5 py-1 rounded-lg text-gray-300 border border-borderDark font-medium">
                {movie.year}
              </span>
            )}

            {movie.runtime > 0 && (
              <span className="text-gray-400">
                {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
              </span>
            )}

            {movie.director && (
              <span className="text-gray-300 font-medium">
                Dir: <strong className="text-white">{movie.director}</strong>
              </span>
            )}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
            {movie.genres.map((g) => (
              <span
                key={g}
                className="text-[11px] font-semibold text-gray-300 bg-surface/80 border border-borderDark px-2.5 py-0.5 rounded-md"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Overview */}
          <p className="text-gray-400 text-sm sm:text-base line-clamp-3 max-w-2xl mb-6">
            {movie.overview || movie.tagline}
          </p>

          {/* Cast */}
          {movie.cast.length > 0 && (
            <p className="text-xs text-gray-400 mb-6">
              <span className="text-gray-500 font-semibold uppercase tracking-wider">Starring:</span>{" "}
              {movie.cast.join(", ")}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              onClick={() => onOpenModal(movie)}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-accent/30"
            >
              <Play className="w-4 h-4 fill-white" />
              Explore Details & Recommendations
            </button>

            <button
              onClick={() => toggleWatchlist(movie)}
              className={`flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl transition border ${
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
        </div>
      </div>
    </div>
  );
}
