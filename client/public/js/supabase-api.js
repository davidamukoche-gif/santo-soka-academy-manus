// Santos Soka Academy — Supabase browser client
(() => {
  const SUPABASE_URL = window.NEXT_PUBLIC_SUPABASE_URL || "https://zfsotexwntalgvmsmduq.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = window.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_gQ-kUAQ0guiN4Ct8ClRJ1Q_KBeL7ibe";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { detectSessionInUrl: true } });
  const API_BASE = `${SUPABASE_URL}/functions/v1/academy-api`;

  const api = async (path, options = {}) => {
    const { data: { session } } = await client.auth.getSession();
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error || "The request could not be completed.");
    return body;
  };

  const signInWithPassword = async (email, password) => {
    const result = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (result.error) throw result.error;
    return result.data;
  };
  const sendPasswordReset = async (email) => {
    const result = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/admin/reset-password.html` });
    if (result.error) throw result.error;
  };

  const requireAdmin = async () => {
    const { data: { session } } = await client.auth.getSession();
    if (!session) return null;
    try {
      const profile = await api("/auth/me");
      if (!profile || profile.role !== "admin") {
        await client.auth.signOut();
        return null;
      }
      return profile;
    } catch {
      await client.auth.signOut();
      return null;
    }
  };

  window.SantosAPI = {
    client,
    api,
    signInWithPassword,
    sendPasswordReset,
    requireAdmin,
    signOut: () => client.auth.signOut(),
    getSession: () => client.auth.getSession(),
    onAuthStateChange: (callback) => client.auth.onAuthStateChange(callback),
  };
})();
