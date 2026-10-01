// app/dashboard/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateCompliance, type ComplianceStatus } from "@/lib/ce-calculator";
import { getItemUrgency, ITEM_TYPE_LABELS } from "@/lib/compliance-status";
import { formatMissingSpecial } from "@/lib/special-requirement-labels";
import SignOutButton from "./sign-out-button";

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

const STATUS_LABEL: Record<ComplianceStatus, { label: string; color: string }> = {
  compliant: { label: "Compliant", color: "var(--green)" },
  needs_hours: { label: "Needs hours", color: "var(--amber)" },
  at_risk: { label: "At risk", color: "var(--red)" },
  expired: { label: "Expired", color: "var(--red)" },
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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

  return (
    <main className="min-h-screen bg-(--paper)">
      <header className="border-b border-(--line)">
        <div className="max-w-270 mx-auto px-7 py-5 min-h-20 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif-brand font-bold text-[19px] flex items-center gap-2"
          >
            <span
              className="w-4 h-4 rounded-[3px]"
              style={{
                background:
                  "linear-gradient(135deg, var(--amber), var(--ink) 130%)",
              }}
            />
            LicensedRight
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[13.5px] text-(--muted)">{user.email}</span>
            <Link
              href="/dashboard/settings"
              className="text-[13.5px] text-(--muted) hover:text-(--ink) transition-colors"
            >
              Settings
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="max-w-270 mx-auto px-7 py-10">
        <div className="flex items-center justify-between mb-8">
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
          <Link
            href="/dashboard/new"
            className="rounded-md bg-(--ink) text-(--paper) px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            + Add license
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="bg-(--card) border border-(--line) rounded-[10px] p-12 text-center">
            <p className="text-(--muted) text-[15px]">
              You haven&apos;t added any licenses yet.
            </p>
            <Link
              href="/dashboard/new"
              className="inline-block mt-4 rounded-md bg-(--ink) text-(--paper) px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              Add your first license
            </Link>
          </div>
        ) : (
          <div className="bg-(--card) border border-(--line) rounded-[10px] overflow-hidden">
            {withStatus.map(({ license, result }, i) => {
              const status = result ? STATUS_LABEL[result.status] : null;
              return (
                <Link
                  key={license.id}
                  href={`/dashboard/${license.id}`}
                  className={`flex items-center justify-between px-4.5 py-3.5 hover:bg-(--paper2) transition-colors ${
                    i > 0 ? "border-t border-(--line)" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full flex-none"
                      style={{ background: status?.color ?? "var(--muted)" }}
                    />
                    <span className="font-semibold text-[14.5px]">
                      {license.state_code} · {license.license_type}
                    </span>
                    <span className="text-[12.5px] text-(--muted)">
                      {status?.label ?? "No rules on file"}
                    </span>
                    {result && (
                      <span className="text-[12.5px] text-(--muted)">
                        · {result.generalHoursCompleted}/
                        {result.generalHoursRequired}h general,{" "}
                        {result.ethicsHoursCompleted}/{result.ethicsHoursRequired}
                        h ethics
                        {result.missingSpecial.length > 0 &&
                          ` · missing ${formatMissingSpecial(result.missingSpecial)}`}
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] text-(--muted) text-right whitespace-nowrap">
                    {result
                      ? result.daysUntilExpiration >= 0
                        ? `Expires in ${result.daysUntilExpiration} days`
                        : `Expired ${Math.abs(result.daysUntilExpiration)} days ago`
                      : new Date(license.expiration_date).toLocaleDateString()}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between mb-8 mt-14">
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
          <Link
            href="/dashboard/compliance/new"
            className="rounded-md bg-(--ink) text-(--paper) px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            + Add item
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-(--card) border border-(--line) rounded-[10px] p-12 text-center">
            <p className="text-(--muted) text-[15px]">
              No E&O policies or carrier appointments tracked yet.
            </p>
            <Link
              href="/dashboard/compliance/new"
              className="inline-block mt-4 rounded-md bg-(--ink) text-(--paper) px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              Add your first item
            </Link>
          </div>
        ) : (
          <div className="bg-(--card) border border-(--line) rounded-[10px] overflow-hidden">
            {items.map((item, i) => {
              const urgency = getItemUrgency(item.expiration_date);
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/compliance/${item.id}`}
                  className={`flex items-center justify-between px-4.5 py-3.5 hover:bg-(--paper2) transition-colors ${
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
                    <span className="text-[12.5px] text-(--muted)">
                      {item.label}
                    </span>
                  </div>
                  <div className="text-[13px] text-(--muted) text-right whitespace-nowrap">
                    {urgency.daysUntilExpiration >= 0
                      ? `Expires in ${urgency.daysUntilExpiration} days`
                      : `Expired ${Math.abs(urgency.daysUntilExpiration)} days ago`}
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