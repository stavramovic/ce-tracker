// app/states/[state]/[type]/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugToLicenseType, STATE_NAMES } from "@/lib/state-slugs";
import StateCalculator from "./state-calculator";

type Props = {
  params: Promise<{ state: string; type: string }>;
};

async function getRule(stateSlug: string, typeSlug: string) {
  const stateCode = stateSlug.toUpperCase();
  const licenseType = slugToLicenseType(typeSlug);
  if (!licenseType) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("state_rules")
    .select(
      "state_code, license_type, ce_hours_required, ethics_hours_required, renewal_cycle_months, renewal_basis, special_requirements, source_url, last_verified_at"
    )
    .eq("state_code", stateCode)
    .eq("license_type", licenseType)
    .single();

  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, type } = await params;
  const rule = await getRule(state, type);
  if (!rule) return {};

  const stateName = STATE_NAMES[rule.state_code] ?? rule.state_code;
  const title = `${stateName} ${rule.license_type} Insurance License CE Requirements | LicensedRight`;
  const description = `${stateName} requires ${rule.ce_hours_required} continuing education hours (including ${rule.ethics_hours_required}h ethics) every ${rule.renewal_cycle_months} months for a ${rule.license_type} insurance license. See the full breakdown and check how many hours you still need.`;

  return { title, description };
}

const SPECIAL_LABELS: Record<string, string> = {
  flood_hours: "Flood insurance",
  annuity_initial_hours: "Annuity (initial)",
  annuity_refresher_hours: "Annuity (refresher)",
  ltc_hours_year_1_to_4: "Long-term care (years 1-4)",
  ltc_refresher_hours: "Long-term care (refresher)",
  homeowner_valuation_onetime_hours: "Homeowner valuation (one-time)",
  personal_lines_only_hours: "Personal lines only",
};

export default async function StateTypePage({ params }: Props) {
  const { state, type } = await params;
  const rule = await getRule(state, type);

  if (!rule) {
    notFound();
  }

  const stateName = STATE_NAMES[rule.state_code] ?? rule.state_code;
  const special = rule.special_requirements ?? {};
  const specialEntries = Object.entries(special).filter(
    ([key]) => SPECIAL_LABELS[key]
  );

  return (
    <main className="min-h-screen bg-(--paper)">
      <header className="border-b border-(--line)">
        <div className="max-w-270 mx-auto px-7 py-5 min-h-20 flex items-center justify-between">
          <Link
            href="/"
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
          <Link
            href="/states"
            className="text-[13.5px] text-(--muted) hover:text-(--ink) transition-colors"
          >
            ← All states
          </Link>
        </div>
      </header>

      <div className="max-w-180 mx-auto px-7 py-12">
        <h1 className="font-serif-brand text-[32px] font-semibold leading-tight">
          {stateName} {rule.license_type} insurance license: CE requirements
        </h1>

        <div className="mt-6 bg-(--card) border border-(--line) rounded-xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div>
            <p className="text-[12.5px] text-(--muted)">Total CE hours</p>
            <p className="text-2xl font-semibold mt-0.5">
              {rule.ce_hours_required}
            </p>
          </div>
          <div>
            <p className="text-[12.5px] text-(--muted)">Ethics hours</p>
            <p className="text-2xl font-semibold mt-0.5">
              {rule.ethics_hours_required}
            </p>
          </div>
          <div>
            <p className="text-[12.5px] text-(--muted)">Renewal cycle</p>
            <p className="text-2xl font-semibold mt-0.5">
              {rule.renewal_cycle_months}mo
            </p>
          </div>
          <div>
            <p className="text-[12.5px] text-(--muted)">Renews based on</p>
            <p className="text-[15px] font-semibold mt-1.5">
              {rule.renewal_basis === "birth_month"
                ? "Birth month"
                : "License issue date"}
            </p>
          </div>
        </div>

        {specialEntries.length > 0 && (
          <div className="mt-6 bg-(--card) border border-(--line) rounded-xl p-6">
            <h2 className="font-serif-brand text-lg font-semibold">
              Extra requirements by product line
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {specialEntries.map(([key, value]) => (
                <li
                  key={key}
                  className="flex items-center justify-between text-[14.5px] py-1.5 border-t border-(--line) first:border-t-0 first:pt-0"
                >
                  <span>{SPECIAL_LABELS[key]}</span>
                  <span className="text-(--muted)">{String(value)}h</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8">
          <StateCalculator rule={rule} />
        </div>

        <p className="mt-6 text-[12.5px] text-(--muted)">
          Source:{" "}
          {rule.source_url ? (
            <a
              href={rule.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-(--ink)"
            >
              {rule.source_url}
            </a>
          ) : (
            "not on file"
          )}
          {rule.last_verified_at
            ? `, last verified ${new Date(rule.last_verified_at).toLocaleDateString()}`
            : ", verify with your state's Department of Insurance before relying on this for renewal."}
          . This page is informational and not legal advice.
        </p>
      </div>
    </main>
  );
}