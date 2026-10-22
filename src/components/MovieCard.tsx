"use client";

import React, { useState } from "react";
import { Movie } from "@/lib/types";
import { Star, Bookmark, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

interface MovieCardProps {
  movie: Movie;
  onOpenModal: (movie: Movie) => void;
  recommendationReason?: string;
}

export function MovieCard({ movie, onOpenModal, recommendationReason }: MovieCardProps) {
  const { isWatchlisted, toggleWatchlist } = useAuth();
  const [imageError, setImageError] = useState(false);
  const inWatchlist = isWatchlisted(movie.id);

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(movie);
  };

  return (
    <div
      onClick={() => onOpenModal(movie)}
      className="group relative flex flex-col bg-card hover:bg-cardHover border border-borderDark/80 hover:border-gray-600 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60"
    >
      {/* Poster Image or Fallback */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface">
        {movie.poster_url && !imageError ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col justify-between p-4 bg-gradient-to-br from-surface via-card to-card border-b border-borderDark">
            <div className="text-[10px] uppercase tracking-widest text-accent font-bold">
              {movie.genres[0] || "Featured Film"}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white line-clamp-3 leading-snug">
                {movie.title}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                {movie.director}
              </p>
            </div>
            <div className="text-right text-xs text-gold font-bold">
              ★ {movie.vote_average.toFixed(1)}
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-black/30 opacity-70 group-hover:opacity-40 transition-opacity" />

        {/* Rating Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-lg text-gold font-bold text-xs border border-white/10">
          <Star className="w-3.5 h-3.5 fill-gold text-gold" />
          <span>{movie.vote_average.toFixed(1)}</span>
        </div>

        {/* Year Badge */}
        {movie.year && (
          <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md px-2 py-1 rounded-lg text-gray-300 font-semibold text-[11px] border border-white/10">
            {movie.year}
          </div>
        )}

        {/* Quick Watchlist Toggle Button */}
        <button
          onClick={handleWatchlistClick}
          aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          className={`absolute bottom-3 right-3 p-2.5 rounded-full transition transform active:scale-90 shadow-lg ${
            inWatchlist
              ? "bg-accent text-white shadow-accent/50 scale-100"
              : "bg-black/80 hover:bg-accent text-white border border-white/20 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
          }`}
        >
          {inWatchlist ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : (
            <Bookmark className="w-4 h-4 fill-none" />
          )}
        </button>

        {/* Recommendation Reason Pill */}
        {recommendationReason && (
          <div className="absolute bottom-3 left-3 right-12 flex items-center gap-1 bg-accent/90 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-1 rounded-md line-clamp-1 shadow-md">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span className="truncate">{recommendationReason}</span>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-sm font-bold text-white group-hover:text-accent transition-colors line-clamp-1">
            {movie.title}
          </h3>

          {movie.director && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
              Dir: <span className="text-gray-300 font-medium">{movie.director}</span>
            </p>
          )}

          {movie.cast.length > 0 && (
            <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
              {movie.cast.slice(0, 3).join(", ")}
            </p>
          )}
        </div>

        {/* Genre Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {movie.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="text-[10px] font-medium text-gray-400 bg-surface px-2 py-0.5 rounded border border-borderDark/60"
            >
              {genre}
            </span>
          ))}
          {movie.genres.length > 2 && (
            <span className="text-[10px] text-gray-500 self-center">
              +{movie.genres.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
