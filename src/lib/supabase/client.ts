import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project-ref.supabase.co" &&
  !supabaseUrl.includes("placeholder")
);

export function createClient() {
  if (!isSupabaseConfigured) {
    // Return a dummy client or client initialized with dummy values to prevent crash
    return createBrowserClient(
      supabaseUrl || "https://dummy.supabase.co",
      supabaseAnonKey || "dummy-anon-key"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
