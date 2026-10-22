import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Cache in memory after first read
let moviesCache: any[] | null = null;
let similarityCache: Record<string, any[]> | null = null;

function loadData() {
  if (!moviesCache) {
    const moviesPath = path.join(process.cwd(), "public", "data", "movies.json");
    const moviesRaw = fs.readFileSync(moviesPath, "utf-8");
    moviesCache = JSON.parse(moviesRaw);
  }
  if (!similarityCache) {
    const simPath = path.join(process.cwd(), "public", "data", "similarity.json");
    const simRaw = fs.readFileSync(simPath, "utf-8");
    similarityCache = JSON.parse(simRaw);
  }
}

export async function GET(request: Request) {
  try {
    loadData();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const similarTo = searchParams.get("similarTo");

    if (id) {
      const movie = moviesCache?.find((m) => m.id === Number(id));
      if (!movie) {
        return NextResponse.json({ error: "Movie not found" }, { status: 404 });
      }
      return NextResponse.json(movie);
    }

    if (similarTo) {
      const similarMatches = similarityCache?.[similarTo] || [];
      const similarMovies = similarMatches.map((item) => {
        const found = moviesCache?.find((m) => m.id === item.id);
        return {
          ...found,
          similarityScore: item.score,
        };
      }).filter(Boolean);

      return NextResponse.json(similarMovies);
    }

    // Default: return top 200 movies or paginated
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    return NextResponse.json({
      total: moviesCache?.length || 0,
      movies: moviesCache?.slice(0, limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
