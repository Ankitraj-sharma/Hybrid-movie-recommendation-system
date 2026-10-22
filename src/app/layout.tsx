import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CineMatch AI - Hybrid Movie Recommendation System",
  description:
    "Discover movies tailored to your taste using Machine Learning, Cosine Similarity, IMDb Bayesian Weighted Ratings, and Multi-Factor Search across Directors, Cast, and Genres.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="w-full border-t border-borderDark/80 py-8 text-center text-xs text-gray-500 bg-card/50">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-medium text-gray-400">
                CineMatch AI • Machine Learning Hybrid Movie Recommendation Engine
              </p>
              <p className="mt-1">
                Powered by TF-IDF & Cosine Similarity, Bayesian Weighted Ratings, Supabase Auth, and Cinemeta/IMDb Data.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
