// app/login/page.tsx
"use client";

import { Suspense, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  // Ako korisnik stize sa invite stranice, mejl mu je vec poznat
  // (pozivnica je poslata na tacno taj mejl) - nema smisla da ga ponovo
  // kuca, to je nepotreban korak.
  const prefillEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(prefillEmail);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-100 bg-(--card) border border-(--line) rounded-[10px] shadow-[0_24px_48px_-24px_rgba(22,35,46,0.18)] p-8">
        {status === "sent" ? (
          <>
            <h1 className="font-serif-brand text-[26px] font-semibold leading-tight">
              Check your email
            </h1>
            <p className="mt-3 text-[15px] text-(--muted) leading-relaxed">
              We sent a login link to{" "}
              <strong className="text-(--ink)">{email}</strong>. Click
              it to sign in. The link is valid for 1 hour.
            </p>
          </>
        ) : (
          <>
            <p className="text-[13px] font-semibold text-(--amber) tracking-wide mb-2">
              GET STARTED
            </p>
            <h1 className="font-serif-brand text-[26px] font-semibold leading-tight">
              Sign in or create an account
            </h1>
            <p className="mt-2 text-[15px] text-(--muted)">
              Enter your email and we&apos;ll send you a link. We&apos;ll
              create your account if you&apos;re new, or sign you in if you
              already have one. No password to remember.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] text-(--ink) outline-none focus:border-(--ink) transition-colors"
              />

              <button
                type="submit"
                disabled={status === "sending"}
                className="rounded-md bg-(--ink) text-(--paper) px-3.5 py-2.5 text-[14.5px] font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {status === "sending" ? "Sending..." : "Send login link"}
              </button>

              {status === "error" && (
                <p className="text-[13.5px] text-(--red)">
                  {errorMessage}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-(--paper) flex flex-col">
      {/* Sitan header sa brendom, konzistentan sa landing page-om */}
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

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
