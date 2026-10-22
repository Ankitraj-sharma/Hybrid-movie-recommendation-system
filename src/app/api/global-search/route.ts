import { NextResponse } from "next/server";
import { Movie } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({ movies: [] });
  }

  try {
    const searchUrl = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(
      query.trim()
    )}.json`;

    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "MovieRecommender/2.0" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ movies: [] });
    }

    const data = await res.json();
    const rawMetas = data.metas || [];

    // Format into standard Movie interface
    const movies: Movie[] = rawMetas.map((item: any, index: number) => {
      const imdbId = item.id || "";
      const year = String(item.year || item.releaseInfo || "");
      const director = Array.isArray(item.director)
        ? item.director[0] || ""
        : typeof item.director === "string"
        ? item.director
        : "";
      const cast = Array.isArray(item.cast)
        ? item.cast.slice(0, 5)
        : typeof item.cast === "string"
        ? item.cast.split(",").map((s: string) => s.trim())
        : [];
      const genres = Array.isArray(item.genres) ? item.genres : [];
      const rating = parseFloat(item.imdbRating || "7.0") || 7.0;

      return {
        id: 9000000 + index + Math.floor(Math.random() * 1000),
        title: item.name || "Untitled",
        overview: item.description || "Global catalog entry.",
        tagline: "",
        director: director,
        cast: cast,
        genres: genres,
        vote_average: rating,
        vote_count: 10000,
        weighted_rating: rating,
        release_date: year ? `${year}-01-01` : "",
        year: year,
        runtime: 120,
        imdb_id: imdbId,
        poster_url: item.poster || (imdbId.startsWith("tt") ? `https://images.metahub.space/poster/medium/${imdbId}/img` : null),
      };
    });

    return NextResponse.json({ movies: movies.slice(0, 20) });
  } catch (error: any) {
    console.error("Global 1M search error:", error);
    return NextResponse.json({ movies: [], error: error.message }, { status: 500 });
  }
}
