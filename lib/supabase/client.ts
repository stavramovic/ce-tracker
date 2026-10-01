// src/lib/supabase/client.ts
// Supabase klijent za korišćenje u Client Components (komponente sa "use client")

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        // Cela app koristi samo magic link (bez OAuth-a, bez lozinke).
        // PKCE (podrazumevano u @supabase/ssr) cuva "code verifier" vezan
        // za browser/tab koji je poslao zahtev - ako se mejl otvori na
        // drugom uredjaju, drugom browseru, ili in-app webview-u iz mejl
        // aplikacije (cest slucaj na mobilnom), taj verifier nije dostupan
        // i verifyOtp puca sa auth_failed. Implicit flow generise
        // samostalan token (verifikuje se sam, bez cookie-ja), sto je
        // ispravan izbor za mejl linkove koji po prirodi putuju izvan
        // browsera koji ih je zatrazio.
        flowType: "implicit",
      },
    }
  );
}