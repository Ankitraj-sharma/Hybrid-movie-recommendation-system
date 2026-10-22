"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "../supabase/client";
import { Movie, WatchlistItem } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  watchlist: number[];
  watchlistItems: WatchlistItem[];
  userRatings: Record<number, number>;
  toggleWatchlist: (movie: Movie) => Promise<boolean>;
  rateMovie: (movieId: number, rating: number) => Promise<void>;
  isWatchlisted: (movieId: number) => boolean;
  getMovieRating: (movieId: number) => number;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [userRatings, setUserRatings] = useState<Record<number, number>>({});
  const supabase = createClient();

  // Load from local storage initially
  useEffect(() => {
    try {
      const savedWatchlist = localStorage.getItem("local_watchlist");
      if (savedWatchlist) {
        const parsed: WatchlistItem[] = JSON.parse(savedWatchlist);
        setWatchlistItems(parsed);
        setWatchlist(parsed.map((item) => item.movie_id));
      }
      const savedRatings = localStorage.getItem("local_ratings");
      if (savedRatings) {
        setUserRatings(JSON.parse(savedRatings));
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync Supabase user
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          await fetchSupabaseUserData(user.id);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchSupabaseUserData(currentUser.id);
        } else {
          // Reset to local storage on sign out
          const saved = localStorage.getItem("local_watchlist");
          if (saved) {
            const parsed = JSON.parse(saved);
            setWatchlistItems(parsed);
            setWatchlist(parsed.map((i: any) => i.movie_id));
          } else {
            setWatchlist([]);
            setWatchlistItems([]);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchSupabaseUserData = async (userId: string) => {
    try {
      // 1. Fetch Watchlist
      const { data: wlData, error: wlError } = await supabase
        .from("watchlists")
        .select("*")
        .eq("user_id", userId);

      if (!wlError && wlData) {
        setWatchlistItems(wlData);
        setWatchlist(wlData.map((item) => item.movie_id));
        localStorage.setItem("local_watchlist", JSON.stringify(wlData));
      }

      // 2. Fetch Ratings
      const { data: rData, error: rError } = await supabase
        .from("movie_ratings")
        .select("movie_id, rating")
        .eq("user_id", userId);

      if (!rError && rData) {
        const ratingsMap: Record<number, number> = {};
        rData.forEach((r) => {
          ratingsMap[r.movie_id] = r.rating;
        });
        setUserRatings(ratingsMap);
        localStorage.setItem("local_ratings", JSON.stringify(ratingsMap));
      }
    } catch (err) {
      console.error("Failed fetching Supabase user data:", err);
    }
  };

  const toggleWatchlist = async (movie: Movie): Promise<boolean> => {
    const isCurrently = watchlist.includes(movie.id);

    if (isCurrently) {
      // Remove
      const newItems = watchlistItems.filter((i) => i.movie_id !== movie.id);
      const newIds = watchlist.filter((id) => id !== movie.id);
      setWatchlistItems(newItems);
      setWatchlist(newIds);
      localStorage.setItem("local_watchlist", JSON.stringify(newItems));

      if (user && isSupabaseConfigured) {
        await supabase
          .from("watchlists")
          .delete()
          .eq("user_id", user.id)
          .eq("movie_id", movie.id);
      }
      return false;
    } else {
      // Add
      const newItem: WatchlistItem = {
        movie_id: movie.id,
        title: movie.title,
        poster_url: movie.poster_url,
        genres: movie.genres,
        director: movie.director,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
      };

      const newItems = [newItem, ...watchlistItems];
      const newIds = [movie.id, ...watchlist];
      setWatchlistItems(newItems);
      setWatchlist(newIds);
      localStorage.setItem("local_watchlist", JSON.stringify(newItems));

      if (user && isSupabaseConfigured) {
        await supabase.from("watchlists").insert({
          user_id: user.id,
          movie_id: movie.id,
          title: movie.title,
          poster_url: movie.poster_url,
          genres: movie.genres,
          director: movie.director,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
        });
      }
      return true;
    }
  };

  const rateMovie = async (movieId: number, rating: number) => {
    const updated = { ...userRatings, [movieId]: rating };
    setUserRatings(updated);
    localStorage.setItem("local_ratings", JSON.stringify(updated));

    if (user && isSupabaseConfigured) {
      await supabase.from("movie_ratings").upsert(
        {
          user_id: user.id,
          movie_id: movieId,
          rating,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,movie_id" }
      );
    }
  };

  const isWatchlisted = (movieId: number) => watchlist.includes(movieId);
  const getMovieRating = (movieId: number) => userRatings[movieId] || 0;

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        watchlist,
        watchlistItems,
        userRatings,
        toggleWatchlist,
        rateMovie,
        isWatchlisted,
        getMovieRating,
        signOut,
        isConfigured: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
