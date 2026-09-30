// src/lib/supabase/middleware.ts
// Pomoćna funkcija koju poziva middleware.ts (u korenu src/) da osvežava
// Supabase auth sesiju (token) na svakom request-u.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // VAŽNO: ne dodavati kod između createServerClient i getUser().
  // Jednostavna greška ovde može da izazove nasumične logout-e korisnika.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ako korisnik nije ulogovan i pokušava da ode na zaštićenu rutu (npr. /dashboard),
  // preusmeri ga na /login. Prilagodi listu ruta kako aplikacija raste.
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/dashboard") &&
    !request.nextUrl.pathname.startsWith("/login")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}