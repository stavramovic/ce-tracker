// app/dashboard/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateCompliance, type ComplianceStatus } from "@/lib/ce-calculator";
import { getItemUrgency, ITEM_TYPE_LABELS } from "@/lib/compliance-status";
import { formatMissingSpecial } from "@/lib/special-requirement-labels";
import { autoAcceptPendingInvites } from "./agency/actions";
import DashboardHeader from "./dashboard-header";
import { HoursBar, StatusBadge, StatusBar, btnPrimary, btnSecondary, type Tone } from "@/components/ui";

type License = {
  id: string;
  state_code: string;
  license_type: string;
  expiration_date: string;
  years_licensed: number | null;
  sells_annuity: boolean;
  sells_ltc: boolean;
  sells_flood: boolean;
};

const STATUS_LABEL: Record<ComplianceStatus, { label: string; tone: Tone }> = {
  compliant: { label: "Compliant", tone: "green" },
  needs_hours: { label: "Needs hours", tone: "amber" },
  at_risk: { label: "At risk", tone: "red" },
  expired: { label: "Expired", tone: "red" },
};

const URGENCY_TONE: Record<string, Tone> = {
  active: "green",
  expiring_soon: "amber",
  expired: "red",
};

function daysText(days: number): string {
  return days >= 0 ? `Expires in ${days} days` : `Expired ${Math.abs(days)} days ago`;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.email) {
    try {
      await autoAcceptPendingInvites(user.id, user.email);
    } catch {
      // best-effort, ne sme da obori dashboard ako ovo puca
    }
  }

  const { data: licenses } = await supabase
    .from("licenses")
    .select(
      "id, state_code, license_type, expiration_date, years_licensed, sells_annuity, sells_ltc, sells_flood"
    )
    .order("expiration_date", { ascending: true });

  const rows = (licenses ?? []) as License[];

  // Za svaku licencu povuci pravilo i kredite, pa izračunaj pravi status.
  // Mala skala za sad (par licenci po korisniku) — ok je da ide paralelno
  // umesto jednog velikog join-a.
  const withStatus = await Promise.all(
    rows.map(async (license) => {
      const [{ data: rule }, { data: credits }] = await Promise.all([
        supabase
          .from("state_rules")
          .select(
            "ce_hours_required, ethics_hours_required, renewal_cycle_months, special_requirements"
          )
          .eq("state_code", license.state_code)
          .eq("license_type", license.license_type)
          .single(),
        supabase
          .from("ce_credits")
          .select("hours, category, completed_date")
          .eq("license_id", license.id),
      ]);

      const result = rule
        ? calculateCompliance(license, rule, credits ?? [])
        : null;

      return { license, result };
    })
  );

  const { data: complianceItems } = await supabase
    .from("compliance_items")
    .select("id, item_type, label, state_code, expiration_date, status")
    .order("expiration_date", { ascending: true });

  const items = complianceItems ?? [];

  // Pregled za vrh dashboarda: koliko licenci je u redu, koliko traži
  // paznju, i koji je sledeci rok (licence + E&O/appointment stavke).
  const counts = { good: 0, attention: 0, expired: 0, unknown: 0 };
  for (const { result } of withStatus) {
    if (!result) counts.unknown++;
    else if (result.status === "compliant") counts.good++;
    else if (result.status === "expired") counts.expired++;
    else counts.attention++;
  }

  const deadlines: { label: string; days: number }[] = [
    ...withStatus
      .filter(({ result }) => result && result.daysUntilExpiration >= 0)
      .map(({ license, result }) => ({
        label: `${license.state_code} ${license.license_type}`,
        days: result!.daysUntilExpiration,
      })),
    ...items
      .map((item) => ({
        label: item.label,
        days: getItemUrgency(item.expiration_date).daysUntilExpiration,
      }))
      .filter((d) => d.days >= 0),
  ].sort((a, b) => a.days - b.days);
  const nextDeadline = deadlines[0];

  const needsAttention = counts.attention + counts.expired;
  const headline =
    needsAttention === 0
      ? "All licenses are in good standing"
      : `${needsAttention} of ${rows.length} license${rows.length === 1 ? "" : "s"} need${
          needsAttention === 1 ? "s" : ""
        } attention`;

  return (
    <main className="min-h-screen bg-(--paper)">
      <DashboardHeader email={user.email} />

      <div className="max-w-270 mx-auto px-7 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif-brand text-[28px] font-semibold">
              Your licenses
            </h1>
            <p className="text-(--muted) text-[15px] mt-1">
              {rows.length === 0
                ? "No licenses yet. Add your first one to get started."
                : `Tracking ${rows.length} license${rows.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {rows.length > 0 && (
              <a href="/api/export/my" className={btnSecondary}>
                Export CSV
              </a>
            )}
            <Link href="/dashboard/new" className={btnPrimary}>
              + Add license
            </Link>
          </div>
        </div>

        {rows.length > 0 && (
          <section
            aria-label="Compliance summary"
            className="bg-(--card) border border-(--line) rounded-xl p-6 mb-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-4">
              <h2 className="font-serif-brand text-[20px] font-semibold">{headline}</h2>
              {nextDeadline && (
                <p className="text-[13.5px] text-(--muted)">
                  Next deadline: <span className="text-(--ink) font-medium">{nextDeadline.label}</span> in{" "}
                  {nextDeadline.days} day{nextDeadline.days === 1 ? "" : "s"}
                </p>
              )}
            </div>
            <StatusBar
              segments={[
                { tone: "green", label: "compliant", count: counts.good },
                { tone: "amber", label: "need attention", count: counts.attention },
                { tone: "red", label: "expired", count: counts.expired },
                { tone: "muted", label: "no rules on file", count: counts.unknown },
              ]}
            />
          </section>
        )}

        {rows.length === 0 ? (
          <div className="bg-(--card) border border-(--line) rounded-xl p-12 text-center">
            <p className="text-(--muted) text-[15px]">
              You haven&apos;t added any licenses yet.
            </p>
            <Link href="/dashboard/new" className={`${btnPrimary} mt-4`}>
              Add your first license
            </Link>
          </div>
        ) : (
          <div className="bg-(--card) border border-(--line) rounded-xl overflow-hidden">
            {withStatus.map(({ license, result }, i) => {
              const status = result ? STATUS_LABEL[result.status] : null;
              return (
                <Link
                  key={license.id}
                  href={`/dashboard/${license.id}`}
                  className={`block px-5 py-4 hover:bg-(--paper2) transition-colors ${
                    i > 0 ? "border-t border-(--line)" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="font-semibold text-[15px]">
                        {license.state_code} · {license.license_type}
                      </span>
                      <StatusBadge tone={status?.tone ?? "muted"}>
                        {status?.label ?? "No rules on file"}
                      </StatusBadge>
                    </div>
                    <div className="text-[13px] text-(--muted) whitespace-nowrap">
                      {result
                        ? daysText(result.daysUntilExpiration)
                        : new Date(license.expiration_date).toLocaleDateString()}
                    </div>
                  </div>

                  {result && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 max-w-xl">
                      <HoursBar
                        label="General"
                        done={result.generalHoursCompleted}
                        required={result.generalHoursRequired}
                      />
                      <HoursBar
                        label="Ethics"
                        done={result.ethicsHoursCompleted}
                        required={result.ethicsHoursRequired}
                      />
                    </div>
                  )}
                  {result && result.missingSpecial.length > 0 && (
                    <p className="mt-2.5 text-[12.5px] text-(--red)">
                      Missing {formatMissingSpecial(result.missingSpecial)}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 mt-14">
          <div>
            <h2 className="font-serif-brand text-[22px] font-semibold">
              E&O insurance & carrier appointments
            </h2>
            <p className="text-(--muted) text-[15px] mt-1">
              {items.length === 0
                ? "Nothing tracked yet. Add your E&O policy or a carrier appointment."
                : `Tracking ${items.length} item${items.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          <Link href="/dashboard/compliance/new" className={btnPrimary}>
            + Add item
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-(--card) border border-(--line) rounded-xl p-12 text-center">
            <p className="text-(--muted) text-[15px]">
              No E&O policies or carrier appointments tracked yet.
            </p>
            <Link href="/dashboard/compliance/new" className={`${btnPrimary} mt-4`}>
              Add your first item
            </Link>
          </div>
        ) : (
          <div className="bg-(--card) border border-(--line) rounded-xl overflow-hidden">
            {items.map((item, i) => {
              const urgency = getItemUrgency(item.expiration_date);
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/compliance/${item.id}`}
                  className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 hover:bg-(--paper2) transition-colors ${
                    i > 0 ? "border-t border-(--line)" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="font-semibold text-[15px]">
                      {ITEM_TYPE_LABELS[item.item_type] ?? item.item_type}
                      {item.state_code ? ` · ${item.state_code}` : ""}
                    </span>
                    <span className="text-[13px] text-(--muted)">{item.label}</span>
                    <StatusBadge tone={URGENCY_TONE[urgency.urgency] ?? "muted"}>
                      {urgency.label}
                    </StatusBadge>
                  </div>
                  <div className="text-[13px] text-(--muted) whitespace-nowrap">
                    {daysText(urgency.daysUntilExpiration)}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
