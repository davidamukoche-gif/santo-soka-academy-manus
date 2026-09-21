import { createClient } from "@supabase/supabase-js";

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return new Response("Missing OAuth code", { status: 400 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return new Response(error.message, { status: 400 });
  return Response.redirect(new URL("/", url.origin));
}
