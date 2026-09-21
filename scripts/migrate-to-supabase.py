from pathlib import Path

root = Path('/home/ubuntu/santo-soka-academy-manus')
public = root / 'client' / 'public'

supabase_api = r'''// Santos Soka Academy — Supabase browser client
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
'''
(public / 'js' / 'supabase-api.js').write_text(supabase_api)

html_files = [root / 'client' / 'index.html', *public.glob('*.html')]
for path in html_files:
    text = path.read_text()
    if '/js/supabase-api.js' not in text:
        marker = '<script src="/js/main.js'
        text = text.replace(marker, '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n    <script src="/js/supabase-api.js?v=20260921"></script>\n    ' + marker, 1)
    path.write_text(text)

main = public / 'js' / 'main.js'
text = main.read_text()
old = '''    const AUTH_ORIGIN = "https://santosoka-dqvkmaei.manus.space";
    const accountItem = document.createElement("li");'''
text = text.replace(old, '''    const accountItem = document.createElement("li");''')
old = '''    const authStartUrl = () => `${AUTH_ORIGIN}/api/oauth/start?returnTo=${encodeURIComponent(`${window.location.pathname}${window.location.search}${window.location.hash}`)}`;
    const rpcAuth = async (procedure, method = "GET") => {
      const response = await fetch(`/api/trpc/${procedure}${method === "GET" ? `?input=${encodeURIComponent(JSON.stringify({ json: null }))}` : "?batch=1"}`, {
        method,
        credentials: "same-origin",
        headers: method === "POST" ? { "content-type": "application/json" } : undefined,
        body: method === "POST" ? JSON.stringify({ 0: { json: null } }) : undefined,
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error("Authentication request failed");
      return body?.[0]?.result?.data?.json ?? body?.result?.data?.json ?? null;
    };'''
text = text.replace(old, '''    const rpcAuth = async (procedure, method = "GET") => {
      if (procedure === "auth.me") return SantosAPI.api("/auth/me");
      if (procedure === "auth.logout") return SantosAPI.signOut();
      return null;
    };''')
text = text.replace('''        const signIn = document.createElement("a");
        signIn.className = "account-link";
        signIn.href = authStartUrl();
        signIn.textContent = "Sign in";
        accountBox.appendChild(signIn);''', '''        const signIn = document.createElement("button");
        signIn.className = "account-link";
        signIn.type = "button";
        signIn.textContent = "Sign in";
        signIn.addEventListener("click", () => SantosAPI.signInWithMagicLink().catch((error) => { accountBox.textContent = error.message; }));
        accountBox.appendChild(signIn);''')
text = text.replace('''        const response = await fetch("/api/trpc/trials.submit?batch=1", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ 0: { json: payload } }),
        });
        const body = await response.json();
        const result = body?.[0]?.result?.data?.json;
        if (!response.ok || !result?.success) throw new Error("Submission failed");''', '''        const result = await SantosAPI.api("/trials", { method: "POST", body: JSON.stringify(payload) });
        if (!result?.success) throw new Error("Submission failed");''')
text = text.replace('''    const response = await fetch(`/api/trpc/fixtures.list?input=${encodeURIComponent(JSON.stringify({ json: null }))}`, { credentials: "same-origin" });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.[0]?.error?.json?.message || "Fixtures unavailable");
    fixtures = body?.[0]?.result?.data?.json ?? body?.result?.data?.json ?? [];''', '''    fixtures = await SantosAPI.api("/fixtures");''')
main.write_text(text)

roster = public / 'js' / 'senior-roster.js'
text = roster.read_text()
start = text.index('  const rpcQuery = async')
end = text.index('\n\n  const renderRoster', start)
text = text[:start] + '''  const toPlayer = (player) => ({ ...player, playerName: player.player_name, imageUrl: player.image_url, displayOrder: player.display_order, isPublished: player.is_published });
  const rpcQuery = async (procedure, input) => {
    const path = procedure === "seniorPlayers.adminList" ? "/admin/senior-players" : "/senior-players";
    const rows = await SantosAPI.api(`${path}?season=${encodeURIComponent(input?.season || "2026/27")}`);
    return rows.map(toPlayer);
  };
  const rpcMutation = async (procedure, input) => {
    if (procedure === "seniorPlayers.remove") return SantosAPI.api(`/admin/senior-players/${input.id}`, { method: "DELETE" });
    if (procedure === "seniorPlayers.create") return SantosAPI.api("/admin/senior-players", { method: "POST", body: JSON.stringify(input) });
    throw new Error("Unsupported roster operation");
  };''' + text[end:]
text = text.replace('''  const AUTH_ORIGIN = "https://santosoka-dqvkmaei.manus.space";

  document.querySelector("#login-button")?.addEventListener("click", () => {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.href = `${AUTH_ORIGIN}/api/oauth/start?returnTo=${encodeURIComponent(returnTo)}`;
  });''', '''  document.querySelector("#login-button")?.addEventListener("click", () => SantosAPI.signInWithMagicLink().catch((error) => setStatus(error.message, "error")));''')
roster.write_text(text)

fixtures = public / 'js' / 'fixture-admin.js'
text = fixtures.read_text()
start = text.index('  const rpcQuery = async')
end = text.index('\n  const escapeHtml', start)
text = text[:start] + '''  const rpcQuery = async (procedure) => SantosAPI.api(procedure === "fixtures.list" ? "/admin/fixtures" : "/fixtures");
  const rpcMutation = async (procedure, input) => {
    const isRemove = procedure === "fixtures.remove";
    return SantosAPI.api(isRemove ? `/admin/fixtures/${input.id}` : "/admin/fixtures", { method: isRemove ? "DELETE" : "POST", body: isRemove ? undefined : JSON.stringify(input) });
  };''' + text[end:]
fixtures.write_text(text)
