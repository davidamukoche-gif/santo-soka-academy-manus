// Santos Soka Academy — Supabase browser client
(() => {
  const SUPABASE_URL = window.NEXT_PUBLIC_SUPABASE_URL || "https://zfsotexwntalgvmsmduq.supabase.co";
  const SUPABASE_ANON_KEY = window.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const API_BASE = `${SUPABASE_URL}/functions/v1/academy-api`;
  const api = async (path, options = {}) => {
    const { data: { session } } = await client.auth.getSession();
    const headers = new Headers(options.headers || {}); headers.set("Content-Type", "application/json");
    if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error || "The request could not be completed.");
    return body;
  };
  const signInWithGoogle = () => client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "https://www.santossokaacademy.co.ke/auth/callback" } });
  window.SantosAPI = { client, api, signInWithGoogle, signOut: () => client.auth.signOut(), getSession: () => client.auth.getSession(), onAuthStateChange: (callback) => client.auth.onAuthStateChange(callback) };
})();
