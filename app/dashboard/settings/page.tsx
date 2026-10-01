// app/dashboard/settings/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "../sign-out-button";
import DeleteAccountForm from "./delete-account-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-(--paper)">
      <header className="border-b border-(--line)">
        <div className="max-w-270 mx-auto px-7 py-5 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="font-serif-brand font-bold text-[19px] flex items-center gap-2"
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
          <div className="flex items-center gap-4">
            <span className="text-[13.5px] text-(--muted)">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="max-w-180 mx-auto px-7 py-10">
        <Link
          href="/dashboard"
          className="text-[13.5px] text-(--muted) hover:text-(--ink) transition-colors"
        >
          ← Back to dashboard
        </Link>

        <h1 className="font-serif-brand text-[28px] font-semibold mt-4">
          Settings
        </h1>

        <div className="mt-8 bg-(--card) border border-(--red) rounded-md p-6">
          <h2
            className="font-serif-brand text-[19px] font-semibold"
            style={{ color: "var(--red)" }}
          >
            Danger zone
          </h2>
          <p className="mt-2 text-[14.5px] text-(--muted) leading-relaxed">
            Deleting your account permanently removes all your licenses, CE
            credits, E&O and carrier appointment records, and reminder
            history. This cannot be undone.
          </p>
          <DeleteAccountForm email={user.email ?? ""} />
        </div>
      </div>
    </main>
  );
}
