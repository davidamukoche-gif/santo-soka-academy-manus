import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn("Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(url ?? "https://zfsotexwntalgvmsmduq.supabase.co", anonKey ?? "", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export const signInWithGoogle = () => supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: "https://www.santossokaacademy.co.ke/auth/callback" },
});
