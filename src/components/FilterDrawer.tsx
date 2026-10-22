"use client";

import React from "react";
import { FilterState } from "@/lib/types";
import { Search, SlidersHorizontal, RotateCcw, Star, Film, User, Tag, Globe, Sparkles } from "lucide-react";

interface FilterDrawerProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  totalFiltered: number;
  availableGenres: string[];
  isGlobalSearch: boolean;
  onToggleGlobalSearch: (val: boolean) => void;
  isSearchingGlobal: boolean;
}

const POPULAR_DIRECTORS = [
  "S.S. Rajamouli",
  "Christopher Nolan",
  "Rajkumar Hirani",
  "Denis Villeneuve",
  "Sanjay Leela Bhansali",
  "Anurag Kashyap",
  "Quentin Tarantino",
  "Sukumar",
  "Mani Ratnam",
  "James Cameron",
];

const POPULAR_ACTORS = [
  "Shah Rukh Khan",
  "Prabhas",
  "Amitabh Bachchan",
  "Allu Arjun",
  "Leonardo DiCaprio",
  "Aamir Khan",
  "Ranbir Kapoor",
  "Salman Khan",
  "Ram Charan",
  "Cillian Murphy",
];

const TRENDING_SEARCHES = [
  "Sholay",
  "3 Idiots",
  "Baahubali",
  "Pushpa 2",
  "RRR",
  "Kalki 2898 AD",
  "Stree 2",
  "Oppenheimer",
  "Dune: Part Two",
  "KGF Chapter 2",
  "12th Fail",
  "Gangs of Wasseypur",
];

export function FilterDrawer({
  filters,
  onFilterChange,
  totalFiltered,
  availableGenres,
  isGlobalSearch,
  onToggleGlobalSearch,
  isSearchingGlobal,
}: FilterDrawerProps) {
  const handleSearchChange = (q: string) => {
    onFilterChange({ ...filters, searchQuery: q });
  };

  const handleDirectorChange = (d: string) => {
    onFilterChange({
      ...filters,
      selectedDirector: filters.selectedDirector === d ? "" : d,
    });
  };

  const handleCastChange = (c: string) => {
    onFilterChange({
      ...filters,
      selectedCast: filters.selectedCast === c ? "" : c,
    });
  };

  const handleGenreToggle = (genre: string) => {
    const isSelected = filters.selectedGenres.includes(genre);
    const updated = isSelected
      ? filters.selectedGenres.filter((g) => g !== genre)
      : [...filters.selectedGenres, genre];
    onFilterChange({ ...filters, selectedGenres: updated });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({ ...filters, minRating: rating });
  };

  const handleSortChange = (sortBy: FilterState["sortBy"]) => {
    onFilterChange({ ...filters, sortBy });
  };

  const handleReset = () => {
    onFilterChange({
      searchQuery: "",
      selectedGenres: [],
      selectedDirector: "",
      selectedCast: "",
      minRating: 0,
      sortBy: "hybrid",
    });
  };

  const hasActiveFilters =
    filters.searchQuery ||
    filters.selectedDirector ||
    filters.selectedCast ||
    filters.selectedGenres.length > 0 ||
    filters.minRating > 0 ||
    filters.sortBy !== "hybrid";

  return (
    <div className="w-full bg-card border border-borderDark/90 rounded-2xl p-5 sm:p-6 mb-8 shadow-xl">
      {/* Search Mode Toggle & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleGlobalSearch(false)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 border ${
              !isGlobalSearch
                ? "bg-accent text-white border-accent shadow-md shadow-accent/30"
                : "bg-surface text-gray-400 border-borderDark hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Curated ML Catalog (5,000+ Bollywood, Tollywood & Hollywood)
          </button>

          <button
            onClick={() => onToggleGlobalSearch(true)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 border ${
              isGlobalSearch
                ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30"
                : "bg-surface text-gray-400 border-borderDark hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            1 Million+ Global Database (1900-2026)
          </button>
        </div>

        {isGlobalSearch && (
          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md font-medium animate-pulse">
            Searching across 1,000,000+ movies on IMDb/TMDB
          </span>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={
            isGlobalSearch
              ? "Search across 1,000,000+ movies (e.g. Oppenheimer, Dune 2, Deadpool, Sholay, Avatar)..."
              : "Search curated titles by movie name, director, actor, or genre..."
          }
          className="w-full bg-surface border border-borderDark focus:border-accent text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3.5 text-sm sm:text-base outline-none transition shadow-inner"
        />
        {filters.searchQuery && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs bg-cardHover px-2 py-1 rounded"
          >
            Clear
          </button>
        )}
      </div>

      {/* Trending / New Movie Quick Chips */}
      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mr-1">
          Trending New Movies:
        </span>
        {TRENDING_SEARCHES.map((title) => (
          <button
            key={title}
            onClick={() => handleSearchChange(title)}
            className="text-[11px] font-medium text-gray-300 bg-surface hover:bg-cardHover border border-borderDark px-2 py-0.5 rounded-md transition hover:border-accent"
          >
            {title}
          </button>
        ))}
      </div>

      {/* Control Bar: Director, Cast, Rating, Sort */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 1. Director Search */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-accent" />
            Director Name
          </label>
          <input
            type="text"
            value={filters.selectedDirector}
            onChange={(e) => onFilterChange({ ...filters, selectedDirector: e.target.value })}
            placeholder="e.g. Christopher Nolan"
            className="w-full bg-surface border border-borderDark focus:border-accent text-white rounded-lg px-3 py-2 text-xs sm:text-sm outline-none"
          />
        </div>

        {/* 2. Cast / Actor Search */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gold" />
            Cast / Actor
          </label>
          <input
            type="text"
            value={filters.selectedCast}
            onChange={(e) => onFilterChange({ ...filters, selectedCast: e.target.value })}
            placeholder="e.g. Cillian Murphy"
            className="w-full bg-surface border border-borderDark focus:border-accent text-white rounded-lg px-3 py-2 text-xs sm:text-sm outline-none"
          />
        </div>

        {/* 3. Min Rating Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-gold" />
              Min Rating
            </label>
            <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/30">
              {filters.minRating > 0 ? `${filters.minRating.toFixed(1)}+ Stars` : "All Ratings"}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={9}
            step={0.5}
            value={filters.minRating}
            onChange={(e) => handleRatingChange(parseFloat(e.target.value))}
            className="w-full accent-accent cursor-pointer"
          />
        </div>

        {/* 4. Sort By */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value as any)}
            className="w-full bg-surface border border-borderDark focus:border-accent text-white rounded-lg px-3 py-2 text-xs sm:text-sm outline-none cursor-pointer"
          >
            <option value="hybrid">✨ Hybrid ML Score (Recommended)</option>
            <option value="rating">⭐ Highest Rated (Bayesian IMDb)</option>
            <option value="popularity">🔥 Most Popular (Vote Count)</option>
            <option value="year">📅 Newest Release (Up to 2026)</option>
          </select>
        </div>
      </div>

      {/* Quick Select Chips: Directors */}
      <div className="mb-4">
        <span className="text-xs text-gray-400 font-medium block mb-2">Popular Directors:</span>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_DIRECTORS.map((dir) => {
            const isSelected = filters.selectedDirector.toLowerCase() === dir.toLowerCase();
            return (
              <button
                key={dir}
                onClick={() => handleDirectorChange(dir)}
                className={`text-xs px-2.5 py-1 rounded-full transition font-medium border ${
                  isSelected
                    ? "bg-accent text-white border-accent shadow-sm shadow-accent/40"
                    : "bg-surface hover:bg-cardHover text-gray-300 border-borderDark"
                }`}
              >
                {dir}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Select Chips: Actors */}
      <div className="mb-4">
        <span className="text-xs text-gray-400 font-medium block mb-2">Leading Actors:</span>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_ACTORS.map((actor) => {
            const isSelected = filters.selectedCast.toLowerCase() === actor.toLowerCase();
            return (
              <button
                key={actor}
                onClick={() => handleCastChange(actor)}
                className={`text-xs px-2.5 py-1 rounded-full transition font-medium border ${
                  isSelected
                    ? "bg-gold text-black font-bold border-gold shadow-sm shadow-gold/40"
                    : "bg-surface hover:bg-cardHover text-gray-300 border-borderDark"
                }`}
              >
                {actor}
              </button>
            );
          })}
        </div>
      </div>

      {/* Genre Multi-select Pills */}
      <div className="pt-2 border-t border-borderDark/80">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-accent" />
            Genres
          </span>
          {filters.selectedGenres.length > 0 && (
            <span className="text-xs text-accent font-semibold">
              {filters.selectedGenres.length} selected
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {availableGenres.map((genre) => {
            const isSelected = filters.selectedGenres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => handleGenreToggle(genre)}
                className={`text-xs px-3 py-1 rounded-lg transition font-medium border ${
                  isSelected
                    ? "bg-accent text-white border-accent shadow-sm"
                    : "bg-surface hover:bg-cardHover text-gray-300 border-borderDark"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-borderDark/80 text-xs text-gray-400">
        <div>
          {isSearchingGlobal ? (
            <span className="text-emerald-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Searching 1 Million+ global database in real-time...
            </span>
          ) : (
            <span>
              Showing <span className="font-bold text-white">{totalFiltered}</span> movies matching your criteria
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-accent hover:text-accent-hover font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Filters
          </button>
        )}
      </div>
    </div>
  );
}
