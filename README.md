# 🎬 CineMatch AI: Hybrid Movie Recommendation System

A production-grade, full-stack **Hybrid Movie Recommendation System** combining Machine Learning (Content-Based Filtering on Director, Cast, Genres & Overview + Bayesian IMDb Weighted Rating + Collaborative User-Preference Blending) with a modern **Next.js 15** frontend and **Supabase** for Authentication and Database persistence.

![License](https://img.shields.io/badge/license-Apache_2.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black)
![React](https://img.shields.io/badge/React-19.0.0-61dafb)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_DB-3ecf8e)
![Python](https://img.shields.io/badge/Python-Scikit--Learn-yellow)

---

## 🌟 Key Features

1. **🧠 Hybrid Machine Learning Recommendation Engine**:
   - **Content-Based Filtering**: Feature engineering on a weighted "metadata soup" featuring **Directors ($3\times$)**, **Lead Cast ($2\times$)**, **Genres ($2\times$)**, keywords, and storyline tokens using `CountVectorizer` and `cosine_similarity`.
   - **Bayesian IMDb Weighted Rating ($WR$)**:
     $$WR = \left(\frac{v}{v+m}\right) \cdot R + \left(\frac{m}{v+m}\right) \cdot C$$
     Prevents obscure movies with a single rating of 10 from skewing suggestions, ensuring high-quality, reputable recommendations.
   - **Personalized Collaborative Blending**: Automatically calculates composite taste vectors based on the user's Watchlist and Star Ratings stored in Supabase.

2. **🔍 Multi-Factor Search & Dynamic Filtering**:
   - **Director Search**: Explore complete filmographies of iconic directors (*Christopher Nolan, Quentin Tarantino, Martin Scorsese, James Cameron, Denis Villeneuve, Steven Spielberg*).
   - **Cast / Actor Search**: Filter titles by leading actors (*Leonardo DiCaprio, Christian Bale, Scarlett Johansson, Cillian Murphy, Brad Pitt*).
   - **Genre Filtering**: Multi-select genre tags (*Action, Sci-Fi, Thriller, Drama, Romance, Crime, Comedy, Fantasy, etc.*).
   - **Rating Threshold Slider**: Dynamically filter minimum IMDb ratings ($0.0 - 10.0$ stars).
   - **Flexible Sorting**: Switch between **Hybrid ML Match**, **Highest Rated (Bayesian)**, **Most Popular**, and **Newest Release**.

3. **🔐 Supabase Authentication & Real-time Database**:
   - **Google Sign-In & Email/Password Sign-In**: Powered by Supabase Auth.
   - **Cloud Watchlist**: Add/remove movies synced across all devices with PostgreSQL Row Level Security (RLS).
   - **Interactive 10-Star Rating System**: Save movie ratings to refine personal recommendation profiles.
   - **Guest / Offline Mode**: Works out of the box with browser `localStorage` even before configuring Supabase.

4. **🚀 Resilient Media & CDN Architecture**:
   - Uses Cinemeta & IMDb CDN (`https://images.metahub.space/poster/medium/{imdb_id}/img`), ensuring fast, reliable poster loading without ISP blocks.
   - Elegant SVG/gradient fallbacks for missing assets.

---

## 🛠️ Project Architecture

```text
Hybrid-movie-recommendation-system/
├── scripts/
│   └── prepare_hybrid_model.py     # Python ML pipeline (Data fetch, vectorization, cosine similarity)
├── supabase/
│   └── schema.sql                  # Complete PostgreSQL schema (profiles, watchlists, ratings, RLS)
├── public/
│   └── data/
│       ├── movies.json             # Clean 4,800-movie catalog with directors, cast, ratings, and posters
│       └── similarity.json         # Precomputed top-25 cosine similarity lookup table
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root Layout with AuthProvider & Navbar
│   │   ├── page.tsx                # Discovery Home with Hero, Filters & Recommendations
│   │   ├── watchlist/page.tsx      # Saved Watchlist & Personalized AI Suggestions
│   │   ├── api/movies/route.ts     # Movie catalog and similarity API endpoint
│   │   └── auth/callback/route.ts  # Supabase OAuth redirect handler
│   ├── components/
│   │   ├── Navbar.tsx              # Navigation bar, auth menu, watchlist count
│   │   ├── HeroBanner.tsx          # Featured spotlight hero
│   │   ├── FilterDrawer.tsx        # Multi-factor Director, Cast, Genre & Rating filter
│   │   ├── MovieCard.tsx           # Movie card with hover effects and watchlist toggle
│   │   ├── MovieModal.tsx          # Detailed preview, trailer button, and ML similar movies
│   │   └── AuthModal.tsx           # Google and Email login modal
│   └── lib/
│       ├── context/AuthContext.tsx # Supabase auth & watchlist synchronization
│       ├── supabase/client.ts      # Client-side Supabase client
│       ├── supabase/server.ts      # Server-side Supabase client
│       ├── recommendation.ts       # Hybrid recommendation and filtering algorithms
│       └── types.ts                # TypeScript interfaces
├── .env.example                    # Environment variables template
├── package.json                    # Node dependencies
└── README.md                       # Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18 or higher (v24 recommended)
- **Python**: 3.10+ (for re-running or retraining ML pipeline)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/hybrid-movie-recommendation-system.git
cd hybrid-movie-recommendation-system

# Install dependencies
npm install
```

### 3. (Optional) Run the Machine Learning Pipeline
The repository already contains the compiled `public/data/movies.json` and `public/data/similarity.json`. To re-compute or modify the model:
```bash
# Setup virtual environment and dependencies
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt

# Run ML pipeline
.venv/Scripts/python scripts/prepare_hybrid_model.py
```

### 4. Supabase Setup (Database & Auth)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Copy the contents of `supabase/schema.sql` and click **Run**.
4. Go to **Project Settings > API** and copy:
   - `Project URL`
   - `anon public key`
5. Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
6. (Optional for Google Sign-In): In Supabase Dashboard, go to **Authentication > Providers > Google**, enable Google, and paste your Google OAuth Client ID and Secret.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploy to Vercel (1-Click)

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of CineMatch AI Hybrid Movie Recommender"
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Your app is live!

---

## 📄 License
This project is licensed under the Apache 2.0 License.
