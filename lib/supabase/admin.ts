// lib/supabase/admin.ts
// SAMO za server-side kod koji mora da vidi podatke SVIH korisnika
// (npr. cron job koji šalje podsetnike). Koristi secret key koji
// zaobilazi RLS pravila — NIKAD ne uvoziti ovaj fajl u Client Component
// ili bilo šta što se šalje u browser.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}