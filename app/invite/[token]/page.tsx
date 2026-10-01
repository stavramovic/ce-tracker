// app/invite/[token]/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { acceptInviteAction } from "./actions";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("agency_members")
    .select("email, joined_at, agency_id")
    .eq("invite_token", token)
    .maybeSingle();

  const agencyName = member
    ? (await admin.from("agencies").select("name").eq("id", member.agency_id).maybeSingle())
        .data?.name
    : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-(--paper) flex flex-col">
      <header className="w-full">
        <div className="max-w-270 mx-auto px-7 py-5 min-h-20 flex items-center">
          <Link
            href="/"
            className="font-serif-brand font-bold text-[19px] flex items-center gap-2 w-fit"
          >
            <span
              className="w-4 h-4 rounded-md"
              style={{
                background: "linear-gradient(135deg, var(--amber), var(--ink) 130%)",
              }}
            />
            LicensedRight
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-100 bg-(--card) border border-(--line) rounded-md shadow-[0_24px_48px_-24px_rgba(22,35,46,0.18)] p-8 text-center">
          {!member ? (
            <>
              <h1 className="font-serif-brand text-[22px] font-semibold leading-tight">
                Invite not found
              </h1>
              <p className="mt-3 text-[14.5px] text-(--muted) leading-relaxed">
                This invite link is invalid or has expired. Ask whoever
                invited you to send a new one.
              </p>
            </>
          ) : member.joined_at ? (
            <>
              <h1 className="font-serif-brand text-[22px] font-semibold leading-tight">
                Already accepted
              </h1>
              <p className="mt-3 text-[14.5px] text-(--muted) leading-relaxed">
                This invite has already been used.
              </p>
              <Link
                href="/dashboard"
                className="inline-block mt-5 rounded-md bg-(--ink) text-(--paper) px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity"
              >
                Go to dashboard
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-serif-brand text-[22px] font-semibold leading-tight">
                Join {agencyName}
              </h1>
              <p className="mt-3 text-[14.5px] text-(--muted) leading-relaxed">
                You&apos;ve been invited to join as a team member on{" "}
                <strong className="text-(--ink)">{member.email}</strong>.
              </p>

              {error === "email_mismatch" && (
                <p className="mt-3 text-[13.5px]" style={{ color: "var(--red)" }}>
                  You&apos;re signed in with a different email. Sign out and
                  sign back in with {member.email} to accept.
                </p>
              )}

              {user ? (
                user.email?.toLowerCase() === member.email.toLowerCase() ? (
                  <form action={acceptInviteAction} className="mt-6">
                    <input type="hidden" name="token" value={token} />
                    <button
                      type="submit"
                      className="w-full rounded-md bg-(--ink) text-(--paper) px-3.5 py-2.5 text-[14.5px] font-medium hover:opacity-90 transition-opacity"
                    >
                      Accept invite
                    </button>
                  </form>
                ) : (
                  <p className="mt-5 text-[13.5px] text-(--muted)">
                    Signed in as {user.email}. Sign out, then sign in with{" "}
                    {member.email} to accept this invite.
                  </p>
                )
              ) : (
                <Link
                  href={`/login?next=/invite/${token}&email=${encodeURIComponent(member.email)}`}
                  className="inline-block mt-5 rounded-md bg-(--ink) text-(--paper) px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity"
                >
                  Sign in to accept
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
