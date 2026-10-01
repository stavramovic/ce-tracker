// app/auth/callback/route.ts
// Supabase preusmerava korisnika ovde nakon klika na magic link iz emaila.
// Ova ruta razmenjuje "code" iz URL-a za pravu sesiju (kolačiće), pa
// tek onda šalje korisnika na dashboard.

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // 'next' opciono govori gde da ide posle logina, default je /dashboard
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Ako nešto nije u redu (link istekao, već iskorišćen, itd.)
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}