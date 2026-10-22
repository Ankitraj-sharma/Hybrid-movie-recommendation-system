import os
import sys
import ast
import json
import requests
import io
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Ensure utf-8 encoding for stdout on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

print("=" * 60)
print("[*] Starting Hybrid Movie Recommendation ML Pipeline")
print("=" * 60)

# 1. Download Datasets
MOVIES_URL = "https://raw.githubusercontent.com/noahjett/Movie-Goodreads-Analysis/master/tmdb_5000_movies.csv"
CREDITS_URL = "https://raw.githubusercontent.com/noahjett/Movie-Goodreads-Analysis/master/tmdb_5000_credits.csv"
METADATA_URL = "https://huggingface.co/datasets/Mahziar/Movies/resolve/main/movies_metadata.csv"

print("[*] Step 1/6: Fetching TMDB 5000 Movies & Credits...")
r_movies = requests.get(MOVIES_URL)
movies_df = pd.read_csv(io.StringIO(r_movies.text))
print(f"    Loaded {len(movies_df)} movies.")

r_credits = requests.get(CREDITS_URL)
credits_df = pd.read_csv(io.StringIO(r_credits.text))
print(f"    Loaded {len(credits_df)} credits records.")

print("[*] Step 2/6: Fetching IMDb IDs for resilient poster CDN...")
meta_df = pd.read_csv(METADATA_URL, usecols=['id', 'imdb_id'], low_memory=False)
meta_df = meta_df.dropna(subset=['id', 'imdb_id'])
meta_df['id'] = pd.to_numeric(meta_df['id'], errors='coerce')
meta_df = meta_df.dropna(subset=['id'])
meta_df['id'] = meta_df['id'].astype(int)
meta_df = meta_df.drop_duplicates(subset=['id'])
print(f"    Loaded {len(meta_df)} IMDb ID mappings.")

# 2. Merge Datasets
print("[*] Step 3/6: Merging datasets on TMDB ID...")
credits_df.rename(columns={'movie_id': 'id'}, inplace=True)
df = pd.merge(movies_df, credits_df[['id', 'cast', 'crew']], on='id')
df = pd.merge(df, meta_df, on='id', how='left')

# Filter released movies
df = df[df['status'] == 'Released'].copy()
df['overview'] = df['overview'].fillna('')
df['tagline'] = df['tagline'].fillna('')
df['vote_count'] = df['vote_count'].fillna(0)
df['vote_average'] = df['vote_average'].fillna(0)

# Helper functions to extract metadata
def parse_json(val):
    try:
        if pd.isna(val) or not val:
            return []
        return ast.literal_eval(val)
    except Exception:
        return []

def get_director(crew_list):
    for member in crew_list:
        if member.get('job') == 'Director':
            return member.get('name', '')
    return ''

def get_top_cast(cast_list, top_n=5):
    names = []
    for member in cast_list[:top_n]:
        names.append(member.get('name', ''))
    return [n for n in names if n]

def get_names(items):
    return [i.get('name', '') for i in items if i.get('name')]

print("[*] Step 4/6: Parsing Genres, Keywords, Directors, and Cast...")
df['crew_parsed'] = df['crew'].apply(parse_json)
df['cast_parsed'] = df['cast'].apply(parse_json)
df['genres_parsed'] = df['genres'].apply(parse_json)
df['keywords_parsed'] = df['keywords'].apply(parse_json)

df['director'] = df['crew_parsed'].apply(get_director)
df['cast_names'] = df['cast_parsed'].apply(lambda x: get_top_cast(x, 4))
df['genre_names'] = df['genres_parsed'].apply(get_names)
df['keyword_names'] = df['keywords_parsed'].apply(get_names)

# Compute IMDb Bayesian Weighted Rating:
# WR = (v / (v + m)) * R + (m / (v + m)) * C
C = df['vote_average'].mean()
m = df['vote_count'].quantile(0.65) # Top 35% vote threshold

def weighted_rating(row, m=m, C=C):
    v = row['vote_count']
    R = row['vote_average']
    if v + m == 0:
        return 0
    return round((v / (v + m) * R) + (m / (v + m) * C), 2)

df['weighted_rating'] = df.apply(weighted_rating, axis=1)

# Clean tokens for metadata soup
def clean_token(token):
    return token.lower().replace(" ", "").replace("-", "")

def create_soup(row):
    # Director given 3x weight
    director = [clean_token(row['director'])] * 3 if row['director'] else []
    # Cast given 2x weight
    cast = [clean_token(actor) for actor in row['cast_names']] * 2
    # Genres given 2x weight
    genres = [clean_token(g) for g in row['genre_names']] * 2
    # Keywords
    keywords = [clean_token(k) for k in row['keyword_names']]
    # Overview words
    overview = row['overview'].lower().split()
    
    return " ".join(director + cast + genres + keywords + overview)

df['soup'] = df.apply(create_soup, axis=1)

# 3. Vectorization and Cosine Similarity
print("[*] Step 5/6: Vectorizing with CountVectorizer & Calculating Cosine Similarity...")
count = CountVectorizer(stop_words='english', min_df=2, max_features=12000)
count_matrix = count.fit_transform(df['soup'])

cosine_sim = cosine_similarity(count_matrix, count_matrix)
print(f"    Similarity Matrix Shape: {cosine_sim.shape}")

# 4. Generate Similarity Index
print("[*] Step 6/6: Compiling clean movies.json and similarity index lookup...")
os.makedirs('public/data', exist_ok=True)

# Build movie lookup list
movies_clean = []
for idx, row in df.iterrows():
    imdb_id = str(row['imdb_id']) if pd.notna(row['imdb_id']) else ''
    poster_url = f"https://images.metahub.space/poster/medium/{imdb_id}/img" if imdb_id.startswith('tt') else None
    
    year = ''
    if pd.notna(row['release_date']) and len(str(row['release_date'])) >= 4:
        year = str(row['release_date'])[:4]

    movie_item = {
        "id": int(row['id']),
        "title": str(row['title']),
        "overview": str(row['overview']),
        "tagline": str(row['tagline']),
        "director": str(row['director']),
        "cast": list(row['cast_names']),
        "genres": list(row['genre_names']),
        "vote_average": float(row['vote_average']),
        "vote_count": int(row['vote_count']),
        "weighted_rating": float(row['weighted_rating']),
        "release_date": str(row['release_date']) if pd.notna(row['release_date']) else '',
        "year": year,
        "runtime": int(row['runtime']) if pd.notna(row['runtime']) else 0,
        "imdb_id": imdb_id,
        "poster_url": poster_url,
    }
    movies_clean.append(movie_item)

# Save movies.json
with open('public/data/movies.json', 'w', encoding='utf-8') as f:
    json.dump(movies_clean, f, ensure_ascii=False)
print(f"    [+] Saved public/data/movies.json ({len(movies_clean)} movies)")

# Precompute Top-25 similar movies for each movie ID
similarity_map = {}
for i, row in df.reset_index().iterrows():
    m_id = int(row['id'])
    sim_scores = list(enumerate(cosine_sim[i]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    top_indices = sim_scores[1:26]
    
    sim_list = []
    for sim_idx, score in top_indices:
        sim_id = int(df.iloc[sim_idx]['id'])
        sim_list.append({
            "id": sim_id,
            "score": round(float(score), 4)
        })
    similarity_map[str(m_id)] = sim_list

# Save similarity.json
with open('public/data/similarity.json', 'w', encoding='utf-8') as f:
    json.dump(similarity_map, f)
print(f"    [+] Saved public/data/similarity.json ({len(similarity_map)} indexed entries)")

# Verify sample
print("\n" + "=" * 60)
print("[*] Model Verification Check:")
sample_titles = ["Inception", "The Dark Knight", "The Godfather", "Pulp Fiction", "Avatar"]
for title in sample_titles:
    match = df[df['title'].str.lower() == title.lower()]
    if not match.empty:
        idx = match.index[0]
        m_id = int(match['id'].values[0])
        recs = similarity_map.get(str(m_id), [])
        rec_titles = [df[df['id'] == r['id']]['title'].values[0] for r in recs[:4] if not df[df['id'] == r['id']].empty]
        print(f"[*] Movie: {title} (Dir: {match['director'].values[0]})")
        print(f"    -> Top Recommendations: {', '.join(rec_titles)}")
print("=" * 60)
print("[+] Hybrid ML Pipeline Completed Successfully!")
