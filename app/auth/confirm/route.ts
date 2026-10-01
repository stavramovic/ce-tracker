// app/auth/confirm/route.ts
// Zamena za PKCE "code" flow — koristi token_hash umesto toga, pa link iz
// mejla radi bez obzira u kom browseru/uređaju se otvori (Gmail app,
// drugi browser, mobilni itd. — PKCE je zahtevao ISTI browser koji je
// pokrenuo signup, zbog čega je korisnik bio vraćan na /login i morao da
// unese mejl po drugi put).

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Ako nešto nije u redu (link istekao, već iskorišćen, itd.)
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}