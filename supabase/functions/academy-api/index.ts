import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("FRONTEND_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Content-Type": "application/json",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function error(message: string, status = 400) {
  return json({ error: message }, status);
}

function pathFor(req: Request) {
  return new URL(req.url).pathname
    .replace(/^\/(?:functions\/v1\/)?academy-api/, "")
    .replace(/\/+$/, "") || "/";
}

async function body(req: Request) {
  try { return await req.json(); } catch { return {}; }
}

async function currentUser(req: Request) {
  const header = req.headers.get("Authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const result = await adminClient.auth.getUser(token);
  return result.data.user || null;
}

async function requireAdmin(req: Request) {
  const user = await currentUser(req);
  if (!user) return { user: null, profile: null };
  const { data: profile } = await adminClient.from("profiles").select("id,email,full_name,role").eq("id", user.id).maybeSingle();
  return { user, profile };
}

function stringValue(value: unknown, min: number, max: number) {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max ? value.trim() : null;
}

function validDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function validTime(value: unknown) {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value) ? value : null;
}

async function forwardTrial(input: Record<string, unknown>) {
  const webhookUrl = Deno.env.get("GOOGLE_WORKSPACE_WEBHOOK_URL");
  if (!webhookUrl) return false;
  try {
    const payload = {
      player: input.player,
      dob: input.dob,
      category: input.category,
      parent: input.parent,
      phone: input.phone,
      ...(input.email ? { email: input.email } : {}),
      ...(input.message ? { message: input.message } : {}),
      ...(Deno.env.get("GOOGLE_WORKSPACE_WEBHOOK_SECRET") ? { secret: Deno.env.get("GOOGLE_WORKSPACE_WEBHOOK_SECRET") } : {}),
    };
    const response = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) });
    if (!response.ok) return false;
    const result = await response.json().catch(() => ({}));
    return result.ok === true;
  } catch { return false; }
}

async function handle(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const path = pathFor(req);

  if (req.method === "GET" && path === "/auth/me") {
    const user = await currentUser(req);
    if (!user) return json(null);
    const { data: profile } = await adminClient.from("profiles").select("id,email,full_name,role").eq("id", user.id).maybeSingle();
    return json(profile ? { id: profile.id, email: profile.email || user.email, name: profile.full_name || user.email, role: profile.role } : null);
  }

  if (req.method === "GET" && path === "/senior-players") {
    const season = new URL(req.url).searchParams.get("season") || "2026/27";
    const { data, error: queryError } = await adminClient.from("senior_players").select("id,season,player_name,position,image_key,image_url,display_order,is_published,created_at").eq("season", season).eq("is_published", true).order("display_order", { ascending: true }).order("created_at", { ascending: false });
    if (queryError) return error(queryError.message, 500);
    return json(data || []);
  }

  if (req.method === "GET" && path === "/fixtures") {
    const { data, error: queryError } = await adminClient.from("fixtures").select("id,fixture_date,fixture_time,team,opponent,venue,competition,status,score,scorers").order("fixture_date", { ascending: true }).order("fixture_time", { ascending: true }).order("id", { ascending: true });
    if (queryError) return error(queryError.message, 500);
    return json((data || []).map((row) => ({ ...row, fixtureDate: row.fixture_date, fixtureTime: String(row.fixture_time).slice(0, 5), scorers: Array.isArray(row.scorers) ? row.scorers : [] })));
  }

  if (req.method === "POST" && path === "/trials") {
    const input = await body(req);
    if (input.website) return json({ success: true });
    const player = stringValue(input.player, 2, 160), dob = validDate(input.dob), category = stringValue(input.category, 2, 40), parent = stringValue(input.parent, 2, 160), phone = stringValue(input.phone, 7, 40);
    if (!player || !dob || !category || !parent || !phone) return error("Please complete the required trial fields.");
    const email = input.email ? stringValue(input.email, 3, 320) : null;
    const message = input.message ? stringValue(input.message, 1, 2000) : null;
    const { error: insertError } = await adminClient.from("trial_registrations").insert({ player_name: player, date_of_birth: dob, category, guardian_name: parent, phone, email, message });
    if (insertError) return error(insertError.message, 500);
    const emailForwarded = await forwardTrial({ player, dob, category, parent, phone, email: email || undefined, message: message || undefined });
    return json({ success: true, emailForwarded });
  }

  if (path === "/admin/senior-players" || path === "/admin/fixtures") {
    const { user, profile } = await requireAdmin(req);
    if (!user || profile?.role !== "admin") return error("Administrator access is required.", 403);
  }

  if (req.method === "GET" && path === "/admin/senior-players") {
    const season = new URL(req.url).searchParams.get("season") || "2026/27";
    const { data, error: queryError } = await adminClient.from("senior_players").select("id,season,player_name,position,image_key,image_url,display_order,is_published,created_at").eq("season", season).order("display_order", { ascending: true }).order("created_at", { ascending: false });
    if (queryError) return error(queryError.message, 500);
    return json(data || []);
  }

  if (req.method === "POST" && path === "/admin/senior-players") {
    const input = await body(req);
    const season = stringValue(input.season || "2026/27", 4, 20), playerName = stringValue(input.playerName, 2, 160), position = stringValue(input.position, 2, 60);
    if (!season || !playerName || !position || typeof input.imageData !== "string") return error("Season, player name, position, and image are required.");
    const match = input.imageData.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/);
    if (!match) return error("Upload a JPEG, PNG, or WebP image.");
    const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
    if (bytes.byteLength > 5 * 1024 * 1024) return error("Player images must be 5 MB or smaller.");
    const extension = match[1] === "image/jpeg" ? "jpg" : match[1].slice(6);
    const slug = playerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "player";
    const key = `${season}/${slug}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
    const upload = await adminClient.storage.from("senior-players").upload(key, bytes, { contentType: match[1], upsert: false });
    if (upload.error) return error(upload.error.message, 500);
    const imageUrl = `${supabaseUrl}/storage/v1/object/public/senior-players/${key}`;
    const { data, error: insertError } = await adminClient.from("senior_players").insert({ season, player_name: playerName, position, image_key: key, image_url: imageUrl, display_order: Number.isInteger(input.displayOrder) ? input.displayOrder : 0, is_published: true }).select("id").single();
    if (insertError) return error(insertError.message, 500);
    return json({ id: data.id });
  }

  if (req.method === "DELETE" && path.startsWith("/admin/senior-players/")) {
    const id = path.split("/").pop();
    const { error: deleteError } = await adminClient.from("senior_players").delete().eq("id", id);
    if (deleteError) return error(deleteError.message, 500);
    return json({ success: true });
  }

  if (req.method === "GET" && path === "/admin/fixtures") {
    const { data, error: queryError } = await adminClient.from("fixtures").select("id,fixture_date,fixture_time,team,opponent,venue,competition,status,score,scorers").order("fixture_date", { ascending: true }).order("fixture_time", { ascending: true }).order("id", { ascending: true });
    if (queryError) return error(queryError.message, 500);
    return json((data || []).map((row) => ({ ...row, fixtureDate: row.fixture_date, fixtureTime: String(row.fixture_time).slice(0, 5), scorers: Array.isArray(row.scorers) ? row.scorers : [] })));
  }

  if (req.method === "POST" && path === "/admin/fixtures") {
    const input = await body(req);
    const fixtureDate = validDate(input.fixtureDate), fixtureTime = validTime(input.fixtureTime), team = stringValue(input.team, 2, 40), opponent = stringValue(input.opponent, 2, 160), venue = stringValue(input.venue, 2, 80), competition = stringValue(input.competition, 2, 120);
    const status = ["Upcoming", "FT", "Postponed"].includes(input.status) ? input.status : "Upcoming";
    if (!fixtureDate || !fixtureTime || !team || !opponent || !venue || !competition) return error("Please complete all fixture fields.");
    const scorers = Array.isArray(input.scorers) ? input.scorers.map((value: unknown) => String(value).trim()).filter(Boolean).slice(0, 12) : [];
    const { data, error: insertError } = await adminClient.from("fixtures").insert({ fixture_date: fixtureDate, fixture_time: fixtureTime, team, opponent, venue, competition, status, score: stringValue(input.score || "", 0, 20) || null, scorers }).select("id").single();
    if (insertError) return error(insertError.message, 500);
    return json({ id: data.id });
  }

  if (req.method === "DELETE" && path.startsWith("/admin/fixtures/")) {
    const id = path.split("/").pop();
    const { error: deleteError } = await adminClient.from("fixtures").delete().eq("id", id);
    if (deleteError) return error(deleteError.message, 500);
    return json({ success: true });
  }

  return error("Not found", 404);
}

Deno.serve((req) => handle(req).catch((caught) => { console.error(caught); return error("Internal server error", 500); }));
