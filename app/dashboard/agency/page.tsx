// app/dashboard/agency/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSeatLimit, ACTIVE_STATUSES } from "@/lib/subscription";
import { getMemberOverview } from "@/lib/agency-overview";
import SignOutButton from "../sign-out-button";
import { inviteMember, removeMember } from "./actions";

const STATUS_DOT_COLOR: Record<string, string> = {
  compliant: "var(--green)",
  needs_hours: "var(--amber)",
  at_risk: "var(--red)",
  expired: "var(--red)",
};

const STATUS_SHORT_LABEL: Record<string, string> = {
  compliant: "compliant",
  needs_hours: "needs hours",
  at_risk: "at risk",
  expired: "expired",
};

export default async function AgencyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_name, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isActive = subscription && ACTIVE_STATUSES.includes(subscription.status);
  const seatLimit = isActive ? getSeatLimit(subscription!.plan_name) : 0;

  const admin = createAdminClient();
  const { data: agency } = await admin
    .from("agencies")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: members } = agency
    ? await admin
        .from("agency_members")
        .select("id, user_id, email, invited_at, joined_at")
        .eq("agency_id", agency.id)
        .order("invited_at", { ascending: true })
    : { data: [] };

  const memberRows = members ?? [];

  // Owner dashboard across the team: za svakog PRIHVACENOG clana povuci
  // kompaktan compliance pregled (admin klijent, RLS ovde namerno ne vazi -
  // vlasnistvo nad agencijom je vec provereno iznad preko owner_id).
  const joinedMembers = memberRows.filter((m) => m.joined_at && m.user_id);
  const overviews = await Promise.all(
    joinedMembers.map(async (m) => ({
      memberId: m.id,
      userId: m.user_id as string,
      overview: await getMemberOverview(m.user_id as string),
    }))
  );
  const overviewByMemberId = new Map(overviews.map((o) => [o.memberId, o.overview]));

  return (
    <main className="min-h-screen bg-(--paper)">
      <header className="border-b border-(--line)">
        <div className="max-w-270 mx-auto px-7 py-5 min-h-20 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="font-serif-brand font-bold text-[19px] flex items-center gap-2"
          >
            <span
              className="w-4 h-4 rounded-md"
              style={{
                background: "linear-gradient(135deg, var(--amber), var(--ink) 130%)",
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

        <h1 className="font-serif-brand text-[28px] font-semibold mt-4">Team</h1>

        {seatLimit === 0 ? (
          <div className="mt-6 bg-(--card) border border-(--line) rounded-md p-6">
            <p className="text-[14.5px] text-(--muted) leading-relaxed">
              Team invites are available on the Agency and Agency Plus plans.
              Upgrade to invite other agents under your account.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-block mt-4 rounded-md bg-(--ink) text-(--paper) px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              View plans
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-[14.5px] text-(--muted)">
              {memberRows.length} / {seatLimit} seats used
            </p>

            <form
              action={inviteMember}
              className="mt-6 bg-(--card) border border-(--line) rounded-md p-6 flex flex-col gap-3"
            >
              <label className="text-[13px] font-medium">Invite an agent by email</label>
              <div className="flex gap-3">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="agent@email.com"
                  disabled={memberRows.length >= seatLimit}
                  className="flex-1 rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] outline-none focus:border-(--ink) transition-colors bg-(--paper) disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={memberRows.length >= seatLimit}
                  className="rounded-md bg-(--ink) text-(--paper) px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Send invite
                </button>
              </div>
            </form>

            {memberRows.length > 0 && (
              <div className="mt-6 bg-(--card) border border-(--line) rounded-md overflow-hidden">
                {memberRows.map((m, i) => {
                  const overview = overviewByMemberId.get(m.id);
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center justify-between px-4.5 py-3.5 ${
                        i > 0 ? "border-t border-(--line)" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        {m.joined_at ? (
                          <Link
                            href={`/dashboard/agency/${m.id}`}
                            className="text-[14px] font-medium hover:underline"
                          >
                            {m.email}
                          </Link>
                        ) : (
                          <p className="text-[14px] font-medium">{m.email}</p>
                        )}
                        {overview ? (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="text-[12.5px] text-(--muted)">
                              {overview.licenses.length} license
                              {overview.licenses.length === 1 ? "" : "s"}
                            </span>
                            {(Object.keys(overview.statusCounts) as Array<keyof typeof overview.statusCounts>)
                              .filter((status) => overview.statusCounts[status] > 0)
                              .map((status) => (
                                <span
                                  key={status}
                                  className="flex items-center gap-1.5 text-[12.5px] text-(--muted)"
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full flex-none"
                                    style={{ background: STATUS_DOT_COLOR[status] }}
                                  />
                                  {overview.statusCounts[status]} {STATUS_SHORT_LABEL[status]}
                                </span>
                              ))}
                            {overview.nearestLicenseExpirationDays !== null && (
                              <span className="text-[12.5px] text-(--muted)">
                                · next renewal in {overview.nearestLicenseExpirationDays}d
                              </span>
                            )}
                            {overview.itemsNeedingAttention > 0 && (
                              <span className="text-[12.5px]" style={{ color: "var(--red)" }}>
                                · {overview.itemsNeedingAttention} E&amp;O/appointment item
                                {overview.itemsNeedingAttention === 1 ? "" : "s"} need attention
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-[12.5px] text-(--muted) mt-0.5">Invite pending</p>
                        )}
                      </div>
                      <form action={removeMember.bind(null, m.id)}>
                        <button
                          type="submit"
                          className="text-[13px] text-(--muted) hover:text-(--red) transition-colors flex-none ml-3"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
