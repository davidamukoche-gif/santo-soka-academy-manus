import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return new Response(error.message, { status: 400 });
  }

  return Response.redirect(new URL("/", requestUrl.origin));
}
