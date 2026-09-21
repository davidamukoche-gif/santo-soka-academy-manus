// Santos Soka Academy — Supabase browser client
(() => {
  const SUPABASE_URL = "https://zfsotexwntalgvmsmduq.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gQ-kUAQ0guiN4Ct8ClRJ1Q_KBeL7ibe";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
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

  const signInWithMagicLink = async () => {
    const email = window.prompt("Enter your email address to receive a secure sign-in link:");
    if (!email) return false;
    const { error } = await client.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
    });
    if (error) throw error;
    window.alert("Check your email for the secure Santos Soka Academy sign-in link.");
    return true;
  };

  window.SantosAPI = {
    client,
    api,
    signInWithMagicLink,
    signOut: () => client.auth.signOut(),
    getSession: () => client.auth.getSession(),
    onAuthStateChange: (callback) => client.auth.onAuthStateChange(callback),
  };
})();
