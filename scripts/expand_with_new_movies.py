import json
import requests
import sys
import re

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

print("[*] Fetching top 2020-2026 modern blockbusters and acclaimed releases...")

RECENT_IMDB_IDS = [
    "tt15398776",  # Oppenheimer (2023) - Christopher Nolan
    "tt1517268",   # Barbie (2023) - Greta Gerwig
    "tt1160419",   # Dune (2021) - Denis Villeneuve
    "tt15239678",  # Dune: Part Two (2024) - Denis Villeneuve
    "tt6263850",   # Deadpool & Wolverine (2024)
    "tt1745960",   # Top Gun: Maverick (2022)
    "tt1630029",   # Avatar: The Way of Water (2022) - James Cameron
    "tt10872604",  # Spider-Man: No Way Home (2021)
    "tt1877830",   # The Batman (2022)
    "tt6710474",   # Everything Everywhere All at Once (2022)
    "tt9362722",   # Spider-Man: Across the Spider-Verse (2023)
    "tt6791350",   # Guardians of the Galaxy Vol. 3 (2023)
    "tt9603212",   # Mission: Impossible - Dead Reckoning (2023)
    "tt5537002",   # Killers of the Flower Moon (2023) - Martin Scorsese
    "tt14230458",  # Poor Things (2023) - Yorgos Lanthimos
    "tt22022452",  # Inside Out 2 (2024)
    "tt18411490",  # Alien: Romulus (2024)
    "tt9660502",   # Gladiator II (2024) - Ridley Scott
    "tt11315808",  # Joker: Folie a Deux (2024)
    "tt14849194",  # The Holdovers (2023)
    "tt13238346",  # Past Lives (2023)
    "tt17009710",  # Anatomy of a Fall (2023)
    "tt7160372",   # The Zone of Interest (2023)
    "tt17526714",  # The Substance (2024)
    "tt12584954",  # Twisters (2024)
    "tt12037194",  # Furiosa: A Mad Max Saga (2024)
    "tt11389872",  # Kingdom of the Planet of the Apes (2024)
    "tt23289160",  # Godzilla Minus One (2023)
    "tt10366206",  # John Wick: Chapter 4 (2023)
    "tt6723592",   # Tenet (2020) - Christopher Nolan
    "tt13833688",  # The Whale (2022)
    "tt11813216",  # The Banshees of Inisherin (2022)
    "tt11564570",  # Glass Onion: A Knives Out Mystery (2022)
    "tt2382320",   # No Time to Die (2021)
    "tt2948356",   # Soul (2020)
    "tt12361974",  # Zack Snyder's Justice League (2021)
    "tt10665338",  # The Northman (2022)
    "tt3704428",   # Elvis (2022)
    "tt10640346",  # Babylon (2022)
    "tt16426418",  # Challengers (2024)
    "tt17279496",  # Civil War (2024)
    "tt1262426",   # Wicked (2024)
    "tt13622970",  # Moana 2 (2024)
    "tt12735488",  # Kalki 2898 AD (2024)
    "tt8178634",   # RRR (2022)
    "tt15354916",  # Jawan (2023)
    "tt23849204",  # 12th Fail (2023)
    "tt13751694",  # Animal (2023)
    "tt28399580",  # Stree 2 (2024)
]

# Load existing movies.json
with open("public/data/movies.json", "r", encoding="utf-8") as f:
    existing_movies = json.load(f)

existing_ids = {m["id"] for m in existing_movies}
existing_imdb = {m.get("imdb_id") for m in existing_movies if m.get("imdb_id")}
max_id = max(existing_ids) if existing_ids else 500000

new_movies = []
headers = {"User-Agent": "MovieRecommender/2.0"}

for imdb_id in RECENT_IMDB_IDS:
    if imdb_id in existing_imdb:
        continue
    try:
        url = f"https://v3-cinemeta.strem.io/meta/movie/{imdb_id}.json"
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200:
            continue
        data = res.json().get("meta", {})
        if not data or not data.get("name"):
            continue

        max_id += 1
        title = data.get("name")
        year = str(data.get("year", ""))
        overview = data.get("description", "")
        director = data.get("director", [])
        director_str = director[0] if isinstance(director, list) and director else (director if isinstance(director, str) else "")
        cast = data.get("cast", [])
        if isinstance(cast, str):
            cast = [c.strip() for c in cast.split(",")]
        genres = data.get("genres", [])
        try:
            rating = float(data.get("imdbRating", 7.0))
        except Exception:
            rating = 7.0
        
        raw_runtime = str(data.get("runtime", "120"))
        digits = re.findall(r'\d+', raw_runtime)
        runtime_min = int(digits[0]) if digits else 120

        poster_url = f"https://images.metahub.space/poster/medium/{imdb_id}/img"

        movie_item = {
            "id": max_id,
            "title": title,
            "overview": overview,
            "tagline": "",
            "director": director_str,
            "cast": cast[:5],
            "genres": genres,
            "vote_average": rating,
            "vote_count": 50000,
            "weighted_rating": rating,
            "release_date": f"{year}-01-01" if year else "",
            "year": year,
            "runtime": runtime_min,
            "imdb_id": imdb_id,
            "poster_url": poster_url,
        }
        new_movies.append(movie_item)
        print(f" [+] Added: {title} ({year}) | Dir: {director_str} | Rating: {rating}")
    except Exception as e:
        print(f" [!] Skipped {imdb_id}: {e}")

print(f"\n[+] Successfully parsed {len(new_movies)} new blockbusters!")

# Prepend new movies to existing so they appear prominently
all_movies = new_movies + existing_movies
with open("public/data/movies.json", "w", encoding="utf-8") as f:
    json.dump(all_movies, f, ensure_ascii=False)

# Re-link similarity map for new movies
with open("public/data/similarity.json", "r", encoding="utf-8") as f:
    similarity_map = json.load(f)

for m in new_movies:
    # Match with movies sharing the same director or genres
    matches = []
    for other in existing_movies[:500]:
        score = 0.0
        if m["director"] and other.get("director") == m["director"]:
            score += 0.5
        common_genres = set(m["genres"]).intersection(set(other.get("genres", [])))
        score += len(common_genres) * 0.15
        if score > 0:
            matches.append({"id": other["id"], "score": round(min(score, 0.95), 4)})
    matches = sorted(matches, key=lambda x: x["score"], reverse=True)[:25]
    similarity_map[str(m["id"])] = matches

with open("public/data/similarity.json", "w", encoding="utf-8") as f:
    json.dump(similarity_map, f)

print(f"[+] Total movies in database now: {len(all_movies)}")
