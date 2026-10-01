// app/dashboard/agency/[memberId]/page.tsx
// Read-only pregled jednog agenta iz tima, za owner-a. Namerno nema nikakve
// akcije (edit/delete) - owner gleda, ne dira tudje podatke.

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getItemUrgency, ITEM_TYPE_LABELS } from "@/lib/compliance-status";
import { getMemberOverview } from "@/lib/agency-overview";
import SignOutButton from "../../sign-out-button";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  compliant: { label: "Compliant", color: "var(--green)" },
  needs_hours: { label: "Needs hours", color: "var(--amber)" },
  at_risk: { label: "At risk", color: "var(--red)" },
  expired: { label: "Expired", color: "var(--red)" },
};

export default async function AgencyMemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Proveri da ovaj member red stvarno pripada agenciji OVOG owner-a pre
  // nego sto mu se pokaze ista jedan tudji podatak.
  const { data: agency } = await admin
    .from("agencies")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!agency) redirect("/dashboard/agency");

  const { data: member } = await admin
    .from("agency_members")
    .select("id, email, user_id, joined_at")
    .eq("id", memberId)
    .eq("agency_id", agency.id)
    .maybeSingle();

  if (!member || !member.user_id || !member.joined_at) {
    notFound();
  }

  const overview = await getMemberOverview(member.user_id);

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
          href="/dashboard/agency"
          className="text-[13.5px] text-(--muted) hover:text-(--ink) transition-colors"
        >
          ← Back to team
        </Link>

        <h1 className="font-serif-brand text-[28px] font-semibold mt-4">{member.email}</h1>
        <p className="text-(--muted) text-[15px] mt-1">
          Read-only view. Agents manage their own licenses and E&amp;O items.
        </p>

        <h2 className="font-serif-brand text-[20px] font-semibold mt-10 mb-4">Licenses</h2>
        {overview.licenses.length === 0 ? (
          <div className="bg-(--card) border border-(--line) rounded-md p-8 text-center">
            <p className="text-(--muted) text-[14.5px]">No licenses tracked yet.</p>
          </div>
        ) : (
          <div className="bg-(--card) border border-(--line) rounded-md overflow-hidden">
            {overview.licenses.map(({ license, status, daysUntilExpiration }, i) => {
              const statusInfo = status ? STATUS_LABEL[status] : null;
              return (
                <div
                  key={license.id}
                  className={`flex items-center justify-between px-4.5 py-3.5 ${
                    i > 0 ? "border-t border-(--line)" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full flex-none"
                      style={{ background: statusInfo?.color ?? "var(--muted)" }}
                    />
                    <span className="font-semibold text-[14.5px]">
                      {license.state_code} · {license.license_type}
                    </span>
                    <span className="text-[12.5px] text-(--muted)">
                      {statusInfo?.label ?? "No rules on file"}
                    </span>
                  </div>
                  <div className="text-[13px] text-(--muted) text-right whitespace-nowrap">
                    {daysUntilExpiration !== null
                      ? daysUntilExpiration >= 0
                        ? `Expires in ${daysUntilExpiration} days`
                        : `Expired ${Math.abs(daysUntilExpiration)} days ago`
                      : new Date(license.expiration_date).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <h2 className="font-serif-brand text-[20px] font-semibold mt-10 mb-4">
          E&amp;O insurance &amp; carrier appointments
        </h2>
        {overview.complianceItems.length === 0 ? (
          <div className="bg-(--card) border border-(--line) rounded-md p-8 text-center">
            <p className="text-(--muted) text-[14.5px]">Nothing tracked yet.</p>
          </div>
        ) : (
          <div className="bg-(--card) border border-(--line) rounded-md overflow-hidden">
            {overview.complianceItems.map((item, i) => {
              const urgency = getItemUrgency(item.expiration_date);
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-4.5 py-3.5 ${
                    i > 0 ? "border-t border-(--line)" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full flex-none"
                      style={{ background: urgency.color }}
                    />
                    <span className="font-semibold text-[14.5px]">
                      {ITEM_TYPE_LABELS[item.item_type] ?? item.item_type}
                      {item.state_code ? ` · ${item.state_code}` : ""}
                    </span>
                    <span className="text-[12.5px] text-(--muted)">{item.label}</span>
                  </div>
                  <div className="text-[13px] text-(--muted) text-right whitespace-nowrap">
                    {urgency.daysUntilExpiration >= 0
                      ? `Expires in ${urgency.daysUntilExpiration} days`
                      : `Expired ${Math.abs(urgency.daysUntilExpiration)} days ago`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
