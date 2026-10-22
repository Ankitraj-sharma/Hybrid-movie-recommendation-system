import { NextResponse } from "next/server";
import { Movie } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({ movies: [] });
  }

  const cleanQuery = query.trim();

  try {
    // 1. Try Cinemeta Global Catalog
    const searchUrl = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(
      cleanQuery
    )}.json`;

    let movies: Movie[] = [];

    try {
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": "MovieRecommender/2.0" },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        const rawMetas = data.metas || [];

        movies = rawMetas.map((item: any, index: number) => {
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
            overview: item.description || "Global 1M+ catalog entry.",
            tagline: "",
            director: director,
            cast: cast,
            genres: genres,
            vote_average: rating,
            vote_count: 10000,
            weighted_rating: rating,
            release_date: year ? `${year}-01-01` : "",
            year: year,
            runtime: 135,
            imdb_id: imdbId,
            poster_url: item.poster || (imdbId.startsWith("tt") ? `https://images.metahub.space/poster/medium/${imdbId}/img` : null),
          };
        });
      }
    } catch (e) {
      // Cinemeta timed out or errored, proceed to IMDb suggestions fallback
    }

    // 2. Fallback to IMDb Suggest API if Cinemeta returned empty
    if (movies.length === 0) {
      const slug = cleanQuery.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const firstChar = slug[0] || "a";
      const imdbSuggestUrl = `https://v3.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(slug)}.json`;

      const imdbRes = await fetch(imdbSuggestUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(4000),
      });

      if (imdbRes.ok) {
        const imdbData = await imdbRes.json();
        const candidates = imdbData.d || [];

        movies = candidates
          .filter((c: any) => c.qid === "movie" || c.q === "feature" || c.q === "movie")
          .map((c: any, index: number) => {
            const imdbId = c.id || "";
            const year = String(c.y || "");
            const cast = c.s ? c.s.split(",").map((s: string) => s.trim()) : [];
            const poster = c.i?.imageUrl || (imdbId.startsWith("tt") ? `https://images.metahub.space/poster/medium/${imdbId}/img` : null);

            return {
              id: 9500000 + index + Math.floor(Math.random() * 1000),
              title: c.l || cleanQuery,
              overview: `Global IMDb presentation starring ${c.s || "acclaimed cast"}.`,
              tagline: "",
              director: "",
              cast: cast,
              genres: ["Cinema"],
              vote_average: 7.5,
              vote_count: 25000,
              weighted_rating: 7.5,
              release_date: year ? `${year}-01-01` : "",
              year: year,
              runtime: 140,
              imdb_id: imdbId,
              poster_url: poster,
            };
          });
      }
    }

    return NextResponse.json({ movies: movies.slice(0, 24) });
  } catch (error: any) {
    console.error("Global 1M search error:", error);
    return NextResponse.json({ movies: [], error: error.message }, { status: 500 });
  }
}
