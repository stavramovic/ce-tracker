// app/auth/confirm/page.tsx
// Zamena za dosadasnji route.ts. Ovo NE potvrdjuje token odmah kad se stranica
// otvori (GET) - umesto toga prikazuje dugme, i tek klik (POST, server action)
// zaista potrosi token. Razlog: Outlook Safe Links, korporativni antivirus
// gateway-i i neki mobilni mejl klijenti automatski "skeniraju" linkove iz
// mejla tako sto sami otvore GET zahtev ka njima, PRE nego sto korisnik
// uopste klikne. Pošto je token_hash jednokratan, taj automatski scan ga
// potrosi, pa kad pravi covek klikne link - vec je "iskoriscen" i auth failed.
// Dugme + POST resava ovo jer skeneri ne submituju formulare.

import Link from "next/link";
import { confirmEmailAction } from "./actions";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const token_hash = params.token_hash ?? "";
  const type = params.type ?? "";
  const next = params.next ?? "/dashboard";

  const missing = !token_hash || !type;

  return (
    <main className="min-h-screen bg-(--paper) flex flex-col">
      {/* Isti header bar kao login/home/dashboard (max-w-270, px-7, py-5) da
          ne bi bilo skoka u visini/širini pri prelasku između stranica. */}
      <header className="w-full">
        <div className="max-w-270 mx-auto px-7 py-5 min-h-20 flex items-center">
          <Link
            href="/"
            className="font-serif-brand font-bold text-[19px] flex items-center gap-2 w-fit"
          >
            <span
              className="w-4 h-4 rounded-md"
              style={{
                background:
                  "linear-gradient(135deg, var(--amber), var(--ink) 130%)",
              }}
            />
            LicensedRight
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-100 bg-(--card) border border-(--line) rounded-md shadow-[0_24px_48px_-24px_rgba(22,35,46,0.18)] p-8 text-center">
          {missing ? (
            <>
              <h1 className="font-serif-brand text-[22px] font-semibold leading-tight">
                Link is invalid
              </h1>
              <p className="mt-3 text-[14.5px] text-(--muted) leading-relaxed">
                This confirmation link is missing or malformed. Please request a new one from the sign in page.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif-brand text-[22px] font-semibold leading-tight">
                Confirm it&apos;s you
              </h1>
              <p className="mt-3 text-[14.5px] text-(--muted) leading-relaxed">
                Click below to finish signing in to LicensedRight.
              </p>
              <form action={confirmEmailAction} className="mt-6">
                <input type="hidden" name="token_hash" value={token_hash} />
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="next" value={next} />
                <button
                  type="submit"
                  className="w-full rounded-md bg-(--ink) text-(--paper) px-3.5 py-2.5 text-[14.5px] font-medium hover:opacity-90 transition-opacity"
                >
                  Continue to LicensedRight
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}