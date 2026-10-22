/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://degyidpcqpqdiqlqoxgn.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZ3lpZHBjcXBxZGlxbHFveGduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NjU4NDAsImV4cCI6MjEwODI0MTg0MH0.h-k7ieOV0rSwRejzvAclrpsvgzU3-MrqKMbJAbXdkxM",
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.metahub.space',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
      },
    ],
  },
};

export default nextConfig;
