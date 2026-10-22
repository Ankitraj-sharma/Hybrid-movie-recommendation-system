"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Film, Bookmark, User as UserIcon, LogOut, Menu, X, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { AuthModal } from "./AuthModal";

export function Navbar() {
  const { user, watchlist, signOut, isConfigured } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-borderDark/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/30 group-hover:scale-105 transition transform">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                CineMatch <span className="text-accent text-sm font-bold bg-accent/15 px-2 py-0.5 rounded-md border border-accent/30">AI</span>
              </span>
              <span className="hidden sm:block text-[10px] text-gray-400 font-medium -mt-1 tracking-wider uppercase">
                Hybrid Recommendation Engine
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition flex items-center gap-1.5 py-1"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              Discover
            </Link>

            <Link
              href="/watchlist"
              className="relative text-gray-300 hover:text-white transition flex items-center gap-1.5 py-1"
            >
              <Bookmark className="w-4 h-4 text-gold" />
              Watchlist
              {watchlist.length > 0 && (
                <span className="ml-1 bg-accent text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-5 text-center">
                  {watchlist.length}
                </span>
              )}
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 bg-surface hover:bg-cardHover border border-borderDark px-3 py-1.5 rounded-full text-sm text-white transition"
                >
                  <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold uppercase">
                    {user.email ? user.email[0] : "U"}
                  </div>
                  <span className="max-w-[120px] truncate text-xs font-medium hidden sm:inline-block">
                    {user.email?.split("@")[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-borderDark rounded-xl shadow-2xl py-2 z-50 text-sm">
                    <div className="px-4 py-2 border-b border-borderDark">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/watchlist"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-surface transition"
                    >
                      <Bookmark className="w-4 h-4 text-gold" />
                      My Watchlist ({watchlist.length})
                    </Link>

                    <button
                      onClick={() => {
                        signOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-surface transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl transition shadow-md shadow-accent/20"
              >
                <UserIcon className="w-4 h-4" />
                Sign In
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-surface transition"
            >
              {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileNavOpen && (
          <div className="md:hidden bg-card border-b border-borderDark px-4 py-3 space-y-2">
            <Link
              href="/"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-surface hover:text-white text-sm"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              Discover Movies
            </Link>
            <Link
              href="/watchlist"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-surface hover:text-white text-sm"
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-gold" />
                My Watchlist
              </div>
              {watchlist.length > 0 && (
                <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {watchlist.length}
                </span>
              )}
            </Link>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
