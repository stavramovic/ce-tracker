// app/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main>
      <header className="sticky top-0 z-10 bg-(--paper)/95 backdrop-blur-sm border-b border-(--line)">
        <nav className="max-w-270 mx-auto px-7 flex justify-between items-center py-5">
          <div className="font-serif-brand font-bold text-[19px] flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-md"
              style={{
                background:
                  "linear-gradient(135deg, var(--amber), var(--ink) 130%)",
              }}
            />
            LicensedRight
          </div>
          <div className="flex items-center gap-7 text-sm">
            <Link
              href="#features"
              className="hidden sm:inline text-(--muted) hover:text-(--ink) transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="hidden sm:inline text-(--muted) hover:text-(--ink) transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/states"
              className="hidden sm:inline text-(--muted) hover:text-(--ink) transition-colors"
            >
              State requirements
            </Link>
            <Link
              href={user ? "/dashboard" : "/login"}
              className="bg-(--ink) text-(--paper) px-4.5 py-2.5 rounded-md text-sm font-medium whitespace-nowrap hover:opacity-90 transition-opacity"
            >
              {user ? "Go to dashboard" : "Get started"}
            </Link>
          </div>
        </nav>
      </header>

      <div className="max-w-270 mx-auto px-7">
        <div className="hero-rise py-13 lg:py-10 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-14 items-start">
          <div>
            <div className="text-[13px] text-(--amber) font-semibold mb-3.5 tracking-wide">
              FOR INDEPENDENT INSURANCE AGENTS
            </div>
            <h1 className="font-serif-brand text-[34px] sm:text-[40px] lg:text-[46px] leading-[1.1] max-w-lg">
              Your license doesn&apos;t lapse overnight. It lapses when you
              stop tracking it.
            </h1>
            <p className="text-(--muted) text-base lg:text-[17px] max-w-md my-5">
              One dashboard for every state you&apos;re licensed in: status,
              CE hours, and deadlines, instead of five separate notices that
              might not even reach you.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="bg-(--ink) text-(--paper) px-4.5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {user ? "Go to dashboard" : "Start free"}
              </Link>
              <span className="text-[13px] text-(--muted)">
                Free for your first license
              </span>
            </div>
          </div>

          <div className="bg-(--card) border border-(--line) rounded-xl overflow-hidden shadow-[0_24px_48px_-24px_rgba(22,35,46,0.18)]">
            <div className="px-4.5 py-4 border-b border-(--line) flex justify-between items-center">
              <span className="text-xs text-(--muted) font-medium">
                YOUR LICENSES
              </span>
              <span className="text-xs text-(--muted) font-medium">
                4 states
              </span>
            </div>
            {[
              { dot: "var(--green)", state: "California", sub: "P&C", days: "312 days", urgent: false },
              { dot: "var(--amber)", state: "Texas", sub: "Life", days: "41 days · 6h CE short", urgent: true },
              { dot: "var(--red)", state: "Florida", sub: "P&C", days: "expired 3 days ago", urgent: true },
              { dot: "var(--green)", state: "New York", sub: "Life", days: "198 days", urgent: false },
            ].map((row, i) => (
              <div
                key={row.state}
                className={`flex items-center justify-between px-4.5 py-3.5 ${
                  i > 0 ? "border-t border-(--line)" : ""
                } ${row.urgent ? "bg-[#FBF3EE]" : ""}`}
              >
                <span className="flex items-center gap-2.5 font-semibold text-[14.5px]">
                  <span
                    className="w-2 h-2 rounded-full flex-none"
                    style={{ background: row.dot }}
                  />
                  {row.state}
                  <span className="text-[12.5px] text-(--muted) font-normal ml-0.5">
                    {row.sub}
                  </span>
                </span>
                <span className="text-[13px] text-(--muted) text-right whitespace-nowrap">
                  {row.days}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-y border-(--line) bg-(--paper2)">
        <div className="max-w-270 mx-auto px-7 py-8.5 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-9 items-center">
          <div className="font-serif-brand text-[40px] sm:text-[52px] text-(--red) leading-none">
            0
            <small className="block font-sans text-[12.5px] text-(--muted) font-medium mt-1.5">
              GRACE PERIOD
            </small>
          </div>
          <p className="text-[16.5px] max-w-xl m-0">
            Once a license lapses, you can&apos;t write business in that
            state until it&apos;s reinstated, and reinstating after
            expiration is slower and more expensive than renewing on time.
          </p>
        </div>
      </div>

      <section id="features" className="py-15">
        <div className="max-w-270 mx-auto px-7">
          <div className="max-w-xl mb-9">
            <h2 className="font-serif-brand text-[28px]">
              Everything that keeps you eligible to sell, in one place
            </h2>
            <p className="text-(--muted) text-[15.5px] mt-2.5">
              Not just a countdown: the actual requirements, tracked per
              state, plus the other things that quietly lapse alongside
              your license.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-(--line) border border-(--line) rounded-xl overflow-hidden">
            {[
              {
                icon: (
                  <>
                    <rect x="2" y="4" width="18" height="14" rx="2" stroke="#B8842E" strokeWidth="1.6" />
                    <path d="M2 8h18" stroke="#B8842E" strokeWidth="1.6" />
                  </>
                ),
                title: "Unlimited licenses, every state",
                body: "Track as many states and license types as you actually hold, with no artificial cap.",
              },
              {
                icon: (
                  <>
                    <path d="M11 2v9l6 3" stroke="#B8842E" strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx="11" cy="11" r="9" stroke="#B8842E" strokeWidth="1.6" />
                  </>
                ),
                title: "CE hours, by state rules",
                body: "Ethics, flood, annuity, long-term care: the calculator knows each state's specific add-ons.",
              },
              {
                icon: (
                  <>
                    <path d="M3 6l8 6 8-6" stroke="#B8842E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="3" y="4" width="16" height="14" rx="2" stroke="#B8842E" strokeWidth="1.6" />
                  </>
                ),
                title: "Reminders that actually arrive",
                body: "Email and calendar alerts at 90, 60, 30, and 7 days, regardless of the address a state has on file.",
              },
              {
                icon: (
                  <>
                    <rect x="3" y="3" width="16" height="16" rx="2" stroke="#B8842E" strokeWidth="1.6" />
                    <path d="M7 9h8M7 13h5" stroke="#B8842E" strokeWidth="1.6" strokeLinecap="round" />
                  </>
                ),
                title: "E&O insurance tracking",
                body: "Your errors & omissions policy lapses on its own schedule, tracked right alongside your licenses.",
              },
              {
                icon: (
                  <>
                    <circle cx="11" cy="8" r="3.2" stroke="#B8842E" strokeWidth="1.6" />
                    <path d="M4 19c1.5-4 5-5 7-5s5.5 1 7 5" stroke="#B8842E" strokeWidth="1.6" strokeLinecap="round" />
                  </>
                ),
                title: "Carrier appointments",
                body: "Appointments with carriers lapse too, visible next to your license status instead of a separate spreadsheet.",
              },
              {
                icon: (
                  <>
                    <path d="M4 4h14v14H4z" stroke="#B8842E" strokeWidth="1.6" />
                    <path d="M8 2v4M14 2v4" stroke="#B8842E" strokeWidth="1.6" strokeLinecap="round" />
                  </>
                ),
                title: "State-by-state renewal checklist",
                body: "Exactly what's required to renew in each state: not just a date, the actual steps.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-(--card) p-6.5">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="mb-3.5">
                  {f.icon}
                </svg>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-(--muted) text-sm m-0">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-15">
        <div className="max-w-270 mx-auto px-7">
          <div className="border-l-2 border-(--amber) pl-6 max-w-xl">
            <p className="font-serif-brand text-xl font-medium leading-relaxed">
              &ldquo;I&apos;m licensed in six states and used to track it all
              in a spreadsheet. Now I just open one page.&rdquo;
            </p>
            <cite className="block not-italic text-[13.5px] text-(--muted) mt-3.5">
              independent broker, early user
            </cite>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-15">
        <div className="max-w-270 mx-auto px-7">
          <div className="max-w-xl mb-9">
            <h2 className="font-serif-brand text-[28px]">
              Pricing that fits your situation
            </h2>
            <p className="text-(--muted) text-[15.5px] mt-2.5">
              No contracts, cancel anytime. Every plan includes unlimited
              licenses, CE tracking, E&O and appointment tracking,
              reminders, document storage, renewal checklists, and CSV
              export.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[
              {
                name: "Independent Agent",
                price: "$15",
                features: [
                  "1 agent",
                  "Unlimited licenses, every state",
                  "CE hours tracked by state rules",
                  "E&O and carrier appointment tracking",
                  "Reminders at 90, 60, 30, and 7 days",
                  "Audit-ready PDF report",
                  "Email support",
                ],
                featured: false,
              },
              {
                name: "Agency",
                price: "$99",
                features: [
                  "Up to 5 agents",
                  "Owner dashboard across the team",
                  "Everything in Independent Agent",
                ],
                featured: true,
              },
              {
                name: "Agency Plus",
                price: "$179",
                features: ["Up to 15 agents", "Priority support", "Everything in Agency"],
                featured: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`bg-(--card) border rounded-xl p-7 ${
                  plan.featured
                    ? "border-(--ink) shadow-[0_20px_40px_-28px_rgba(22,35,46,0.35)]"
                    : "border-(--line)"
                }`}
              >
                <div className="text-sm text-(--muted) font-medium">
                  {plan.name}
                </div>
                <div className="font-serif-brand text-4xl my-2.5">
                  {plan.price}
                  <span className="text-[15px] text-(--muted) font-sans">
                    /month
                  </span>
                </div>
                <ul className="list-none p-0 m-0 mb-5 text-[13.5px]">
                  {plan.features.map((feat, i) => (
                    <li
                      key={feat}
                      className={`flex gap-2.5 py-1.5 ${
                        i > 0 ? "border-t border-(--line)" : ""
                      }`}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 22 22"
                        fill="none"
                        className="flex-none mt-0.5"
                      >
                        <path
                          d="M4 12l5 5 9-11"
                          stroke="var(--amber)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className={`inline-block px-4.5 py-2.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90 ${
                    plan.featured
                      ? "bg-(--ink) text-(--paper)"
                      : "bg-transparent text-(--ink) border border-(--line)"
                  }`}
                >
                  {user ? "Go to dashboard" : "Choose"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-270 mx-auto px-7">
        <footer className="border-t border-(--line) py-7 text-(--muted) text-[13px] flex flex-wrap items-center justify-between gap-3">
          <span>© 2026 LicensedRight</span>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="hover:text-(--ink) transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-(--ink) transition-colors">
              Privacy
            </Link>
            <span>Not legal advice</span>
          </div>
        </footer>
      </div>
    </main>
  );
}