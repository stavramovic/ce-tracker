// app/dashboard/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateCompliance } from "@/lib/ce-calculator";
import { addCredit } from "./actions";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  compliant: { label: "Compliant", color: "var(--green)" },
  needs_hours: { label: "Needs hours", color: "var(--amber)" },
  at_risk: { label: "At risk", color: "var(--red)" },
  expired: { label: "Expired", color: "var(--red)" },
};

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "ethics", label: "Ethics" },
  { value: "flood", label: "Flood" },
  { value: "annuity", label: "Annuity" },
  { value: "ltc", label: "Long-term care" },
];

export default async function LicenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: license } = await supabase
    .from("licenses")
    .select(
      "id, state_code, license_type, expiration_date, years_licensed, sells_annuity, sells_ltc, sells_flood"
    )
    .eq("id", id)
    .single();

  if (!license) {
    notFound();
  }

  const { data: rule } = await supabase
    .from("state_rules")
    .select(
      "ce_hours_required, ethics_hours_required, renewal_cycle_months, special_requirements"
    )
    .eq("state_code", license.state_code)
    .eq("license_type", license.license_type)
    .single();

  const { data: credits } = await supabase
    .from("ce_credits")
    .select("id, hours, category, course_name, completed_date")
    .eq("license_id", license.id)
    .order("completed_date", { ascending: false });

  const creditRows = credits ?? [];

  const result = rule
    ? calculateCompliance(license, rule, creditRows)
    : null;

  return (
    <main className="min-h-screen bg-(--paper)">
      <header className="border-b border-(--line)">
        <div className="max-w-270 mx-auto px-7 py-5">
          <Link
            href="/dashboard"
            className="text-[13.5px] text-(--muted) hover:text-(--ink) transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-180 mx-auto px-7 py-10">
        <h1 className="font-serif-brand text-[28px] font-semibold">
          {license.state_code} · {license.license_type}
        </h1>
        <p className="text-(--muted) text-[15px] mt-1">
          Expires {new Date(license.expiration_date).toLocaleDateString()}
        </p>

        {!rule && (
          <div className="mt-6 bg-(--card) border border-(--line) rounded-[10px] p-5">
            <p className="text-[14px] text-(--red)">
              No state rules found for {license.state_code} /{" "}
              {license.license_type} yet. Add a row to state_rules to enable
              compliance tracking for this license.
            </p>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-(--card) border border-(--line) rounded-[10px] p-6">
            <div className="flex items-center gap-2.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-none"
                style={{ background: STATUS_LABEL[result.status].color }}
              />
              <span className="font-semibold text-[16px]">
                {STATUS_LABEL[result.status].label}
              </span>
              <span className="text-[13px] text-(--muted)">
                {result.daysUntilExpiration >= 0
                  ? `${result.daysUntilExpiration} days until renewal`
                  : `Expired ${Math.abs(result.daysUntilExpiration)} days ago`}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[12.5px] text-(--muted)">General hours</p>
                <p className="text-[18px] font-semibold mt-0.5">
                  {result.generalHoursCompleted} / {result.generalHoursRequired}
                </p>
              </div>
              <div>
                <p className="text-[12.5px] text-(--muted)">Ethics hours</p>
                <p className="text-[18px] font-semibold mt-0.5">
                  {result.ethicsHoursCompleted} / {result.ethicsHoursRequired}
                </p>
              </div>
            </div>

            {result.missingSpecial.length > 0 && (
              <div className="mt-5 pt-5 border-t border-(--line)">
                <p className="text-[13px] font-medium text-(--red)">
                  Missing special requirements:
                </p>
                <ul className="mt-1.5 text-[13.5px] text-(--muted) list-disc list-inside">
                  {result.missingSpecial.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <h2 className="font-serif-brand text-[19px] font-semibold mb-4">
            Add a CE credit
          </h2>
          <form
            action={addCredit.bind(null, license.id)}
            className="bg-(--card) border border-(--line) rounded-[10px] p-6 flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium mb-1.5">
                  Hours
                </label>
                <input
                  type="number"
                  name="hours"
                  step="0.5"
                  min="0"
                  required
                  className="w-full rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] outline-none focus:border-(--ink) transition-colors bg-(--card)"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-1.5">
                  Category
                </label>
                <select
                  name="category"
                  required
                  defaultValue="general"
                  className="w-full rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] outline-none focus:border-(--ink) transition-colors bg-(--card)"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1.5">
                Course name (optional)
              </label>
              <input
                type="text"
                name="course_name"
                className="w-full rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] outline-none focus:border-(--ink) transition-colors bg-(--card)"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1.5">
                Completed date
              </label>
              <input
                type="date"
                name="completed_date"
                required
                className="w-full rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] outline-none focus:border-(--ink) transition-colors bg-(--card)"
              />
            </div>

            <button
              type="submit"
              className="rounded-md bg-(--ink) text-(--paper) px-3.5 py-2.5 text-[14.5px] font-medium hover:opacity-90 transition-opacity w-fit"
            >
              Add credit
            </button>
          </form>
        </div>

        {creditRows.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif-brand text-[19px] font-semibold mb-4">
              CE credits on file
            </h2>
            <div className="bg-(--card) border border-(--line) rounded-[10px] overflow-hidden">
              {creditRows.map((c, i) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between px-4.5 py-3 ${
                    i > 0 ? "border-t border-(--line)" : ""
                  }`}
                >
                  <div>
                    <span className="text-[14px] font-medium">
                      {c.hours}h · {c.category}
                    </span>
                    {c.course_name && (
                      <span className="text-[13px] text-(--muted) ml-2">
                        {c.course_name}
                      </span>
                    )}
                  </div>
                  <span className="text-[13px] text-(--muted)">
                    {new Date(c.completed_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}