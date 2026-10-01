// app/dashboard/new/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPaidAccess, FREE_LICENSE_LIMIT } from "@/lib/subscription";
import { addLicense } from "../actions";

const STATES = ["CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "WA"];
const LICENSE_TYPES = ["P&C", "Life", "Personal Lines"];

export default async function NewLicensePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!(await hasPaidAccess(user.id))) {
    const { count } = await supabase
      .from("licenses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= FREE_LICENSE_LIMIT) {
      return (
        <main className="min-h-screen bg-(--paper) flex flex-col">
          <header className="border-b border-(--line)">
            <div className="max-w-270 mx-auto px-7 py-5 min-h-20 flex items-center">
              <Link
                href="/dashboard"
                className="text-[13.5px] text-(--muted) hover:text-(--ink) transition-colors"
              >
                ← Back to dashboard
              </Link>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-105 bg-(--card) border border-(--line) rounded-md shadow-[0_24px_48px_-24px_rgba(22,35,46,0.18)] p-8 text-center">
              <h1 className="font-serif-brand text-[22px] font-semibold leading-tight">
                You&apos;re on the free plan
              </h1>
              <p className="mt-3 text-[14.5px] text-(--muted) leading-relaxed">
                The free plan tracks one license. Upgrade to add unlimited
                licenses across every state.
              </p>
              <Link
                href="/dashboard/billing"
                className="inline-block mt-5 rounded-md bg-(--ink) text-(--paper) px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity"
              >
                View plans
              </Link>
            </div>
          </div>
        </main>
      );
    }
  }

  return (
    <main className="min-h-screen bg-(--paper) flex flex-col">
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

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-105 bg-(--card) border border-(--line) rounded-[10px] shadow-[0_24px_48px_-24px_rgba(22,35,46,0.18)] p-8">
          <h1 className="font-serif-brand text-[24px] font-semibold leading-tight">
            Add a license
          </h1>
          <p className="mt-2 text-[14.5px] text-(--muted)">
            We&apos;ll track its renewal date and flag it as it approaches.
          </p>

          <form action={addLicense} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-[13px] font-medium mb-1.5">
                State
              </label>
              <select
                name="state_code"
                required
                defaultValue=""
                className="w-full rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] outline-none focus:border-(--ink) transition-colors bg-(--card)"
              >
                <option value="" disabled>
                  Select a state
                </option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1.5">
                License type
              </label>
              <select
                name="license_type"
                required
                defaultValue=""
                className="w-full rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] outline-none focus:border-(--ink) transition-colors bg-(--card)"
              >
                <option value="" disabled>
                  Select a type
                </option>
                {LICENSE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1.5">
                Expiration date
              </label>
              <input
                type="date"
                name="expiration_date"
                required
                className="w-full rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] outline-none focus:border-(--ink) transition-colors bg-(--card)"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1.5">
                Years licensed (optional)
              </label>
              <input
                type="number"
                name="years_licensed"
                min="0"
                placeholder="e.g. 3"
                className="w-full rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] outline-none focus:border-(--ink) transition-colors bg-(--card)"
              />
              <p className="mt-1 text-[12px] text-(--muted)">
                Some states reduce required hours after a threshold (e.g.
                Florida, Georgia).
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-2">
                Product lines you sell (affects extra requirements)
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[14px]">
                  <input type="checkbox" name="sells_annuity" value="true" />
                  Annuities
                </label>
                <label className="flex items-center gap-2 text-[14px]">
                  <input type="checkbox" name="sells_ltc" value="true" />
                  Long-term care
                </label>
                <label className="flex items-center gap-2 text-[14px]">
                  <input type="checkbox" name="sells_flood" value="true" />
                  Flood insurance
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 rounded-md bg-(--ink) text-(--paper) px-3.5 py-2.5 text-[14.5px] font-medium hover:opacity-90 transition-opacity"
            >
              Add license
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}