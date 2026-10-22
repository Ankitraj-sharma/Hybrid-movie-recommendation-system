import json
import streamlit as st
import pandas as pd

st.set_page_config(
    page_title="CineMatch AI - Hybrid Movie Recommender",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for dark cinema aesthetics
st.markdown("""
<style>
    .stApp {
        background-color: #0b0d13;
        color: #EDEDED;
    }
    .metric-card {
        background: #141822;
        border: 1px solid #232938;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
    }
    .stButton>button {
        background-color: #E50914;
        color: white;
        border-radius: 8px;
        border: none;
        font-weight: bold;
    }
    .stButton>button:hover {
        background-color: #B80710;
        color: white;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def load_data():
    with open("public/data/movies.json", "r", encoding="utf-8") as f:
        movies = json.load(f)
    with open("public/data/similarity.json", "r", encoding="utf-8") as f:
        similarity = json.load(f)
    return movies, similarity

movies, similarity_map = load_data()
movies_by_id = {m["id"]: m for m in movies}
movies_df = pd.DataFrame(movies)

st.title("🎬 CineMatch AI: Hybrid Movie Recommender")
st.caption("Powered by Machine Learning (Content-Based Cosine Similarity + Bayesian Weighted Rating)")

# Sidebar Multi-Factor Filtering
st.sidebar.header("🔍 Search & Filter Filters")

# 1. Text Search
search_query = st.sidebar.text_input("Search Title, Director, or Actor", placeholder="e.g. Inception, Nolan, DiCaprio")

# 2. Director Filter
directors = ["All Directors"] + sorted(list({m["director"] for m in movies if m.get("director")}))
selected_director = st.sidebar.selectbox("Filter by Director", directors)

# 3. Cast / Actor Filter
actors_set = set()
for m in movies:
    for actor in m.get("cast", []):
        if actor:
            actors_set.add(actor)
actors = ["All Actors"] + sorted(list(actors_set))
selected_actor = st.sidebar.selectbox("Filter by Lead Actor", actors)

# 4. Genre Filter
all_genres = sorted(list({g for m in movies for g in m.get("genres", []) if g}))
selected_genres = st.sidebar.multiselect("Filter by Genres", all_genres)

# 5. Rating Slider
min_rating = st.sidebar.slider("Minimum IMDb Rating", min_value=0.0, max_value=9.5, value=0.0, step=0.5)

# 6. Sort By
sort_by = st.sidebar.selectbox("Sort Results By", ["Hybrid ML Score", "Highest Rated", "Most Popular", "Newest"])

# Filtering Logic
filtered = movies_df.copy()

if search_query.strip():
    q = search_query.lower().strip()
    filtered = filtered[
        filtered["title"].str.lower().str.contains(q, na=False) |
        filtered["director"].str.lower().str.contains(q, na=False) |
        filtered["cast"].apply(lambda cast_list: any(q in actor.lower() for actor in cast_list))
    ]

if selected_director != "All Directors":
    filtered = filtered[filtered["director"] == selected_director]

if selected_actor != "All Actors":
    filtered = filtered[filtered["cast"].apply(lambda cast_list: selected_actor in cast_list)]

if selected_genres:
    filtered = filtered[filtered["genres"].apply(lambda g_list: all(g in g_list for g in selected_genres))]

if min_rating > 0:
    filtered = filtered[filtered["vote_average"] >= min_rating]

if sort_by == "Highest Rated":
    filtered = filtered.sort_values(by="weighted_rating", ascending=False)
elif sort_by == "Most Popular":
    filtered = filtered.sort_values(by="vote_count", ascending=False)
elif sort_by == "Newest":
    filtered = filtered.sort_values(by="year", ascending=False)
else:
    filtered["score"] = filtered["weighted_rating"] * 0.7 + (filtered["vote_count"] / 1000).clip(upper=3)
    filtered = filtered.sort_values(by="score", ascending=False)

st.subheader(f"Showing {len(filtered)} Movies")

# Tab Layout: Catalog vs ML Recommender
tab1, tab2 = st.tabs(["🎥 Movie Catalog & Filters", "✨ Similar Movie Recommender"])

with tab1:
    cols = st.columns(4)
    for i, (_, row) in enumerate(filtered.head(28).iterrows()):
        with cols[i % 4]:
            if row.get("poster_url"):
                st.image(row["poster_url"], use_container_width=True)
            st.markdown(f"**{row['title']}** ({row['year']})")
            st.caption(f"⭐ **{row['vote_average']:.1f}** | Dir: {row['director']}")
            st.write(f"🎭 {', '.join(row['genres'][:2])}")
            with st.expander("Details"):
                st.write(row["overview"])
                st.write(f"**Cast:** {', '.join(row['cast'])}")

with tab2:
    st.markdown("### Find Movies Similar to Your Favorite Film")
    selected_title = st.selectbox("Select a Movie to Get AI Recommendations", sorted([m["title"] for m in movies]))
    
    if selected_title:
        target = next((m for m in movies if m["title"] == selected_title), None)
        if target:
            st.markdown(f"**Selected:** *{target['title']}* (Directed by **{target['director']}**)")
            similar_items = similarity_map.get(str(target["id"]), [])
            
            if similar_items:
                rec_cols = st.columns(5)
                for idx, item in enumerate(similar_items[:10]):
                    rec_movie = movies_by_id.get(item["id"])
                    if rec_movie:
                        with rec_cols[idx % 5]:
                            if rec_movie.get("poster_url"):
                                st.image(rec_movie["poster_url"], use_container_width=True)
                            st.markdown(f"**{rec_movie['title']}**")
                            st.caption(f"🎯 **{int(item['score'] * 100)}% Match**")
                            st.caption(f"⭐ {rec_movie['vote_average']} | {rec_movie['director']}")
