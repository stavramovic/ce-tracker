// app/states/page.tsx
// Javna stranica, bez logina. Lista svih država/tipova licence — glavni
// interni-linkovanje hub za SEO, i ulazna tačka za bilo koga ko dođe
// preko Google-a na "insurance CE requirements".

import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { licenseTypeToSlug, STATE_NAMES } from "@/lib/state-slugs";

export const metadata: Metadata = {
  title: "Insurance License CE Requirements by State | LicensedRight",
  description:
    "Continuing education hours, ethics requirements, and renewal rules for insurance producer licenses, by state and license type.",
};

type RuleRow = {
  state_code: string;
  license_type: string;
  ce_hours_required: number;
  renewal_cycle_months: number;
};

export default async function StatesIndexPage() {
  const supabase = await createClient();

  const { data: rules } = await supabase
    .from("state_rules")
    .select("state_code, license_type, ce_hours_required, renewal_cycle_months")
    .order("state_code", { ascending: true });

  const rows = (rules ?? []) as RuleRow[];

  const byState = rows.reduce<Record<string, RuleRow[]>>((acc, row) => {
    acc[row.state_code] = acc[row.state_code] ?? [];
    acc[row.state_code].push(row);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-(--paper)">
      <header className="border-b border-(--line)">
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

      <div className="max-w-270 mx-auto px-7 py-12">
        <p className="text-[13px] font-semibold text-(--amber) tracking-wide mb-2">
          FREE REFERENCE
        </p>
        <h1 className="font-serif-brand text-4xl font-semibold leading-tight max-w-2xl">
          Insurance license CE requirements, by state
        </h1>
        <p className="mt-4 text-[16px] text-(--muted) max-w-xl">
          Continuing education hours, ethics requirements, and renewal rules
          for every state we track. Pick your state to see exact
          requirements and check how many hours you still need.
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(byState).map(([stateCode, stateRules]) => (
            <div
              key={stateCode}
              className="bg-(--card) border border-(--line) rounded-xl p-5"
            >
              <h2 className="font-serif-brand text-lg font-semibold">
                {STATE_NAMES[stateCode] ?? stateCode}
              </h2>
              <div className="mt-3 flex flex-col gap-1.5">
                {stateRules.map((r) => (
                  <Link
                    key={r.license_type}
                    href={`/states/${stateCode.toLowerCase()}/${licenseTypeToSlug(
                      r.license_type
                    )}`}
                    className="text-[14px] text-(--ink) hover:text-(--amber) transition-colors flex items-center justify-between"
                  >
                    <span>{r.license_type}</span>
                    <span className="text-[12.5px] text-(--muted)">
                      {r.ce_hours_required}h / {r.renewal_cycle_months}mo
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 bg-(--card) border border-(--line) rounded-xl p-8 text-center">
          <h3 className="font-serif-brand text-xl font-semibold">
            Don&apos;t want to track this by hand?
          </h3>
          <p className="mt-2 text-[14.5px] text-(--muted)">
            LicensedRight tracks every license automatically and tells you
            exactly what&apos;s left before your renewal date.
          </p>
          <Link
            href="/login"
            className="inline-block mt-4 rounded-md bg-(--ink) text-(--paper) px-5 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            Start free
          </Link>
        </div>
      </div>
    </main>
  );
}