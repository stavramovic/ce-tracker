// src/lib/supabase/server.ts
// Supabase klijent za korišćenje u Server Components, Server Actions i Route Handlers.
// Mora da se pozove IZNOVA u svakom fajlu/funkciji gde se koristi (ne čuvati u promenljivoj
// van funkcije), jer čita kolačiće (cookies) iz trenutnog request-a.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll je pozvan iz Server Component-e — ovo je OK da se ignoriše
            // AKO imaš middleware koji osvežava sesiju (vidi middleware.ts)
          }
        },
      },
    }
  );
}