// app/dashboard/billing/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_STATUSES } from "@/lib/subscription";
import { PLANS } from "@/lib/polar-plans";
import SignOutButton from "../sign-out-button";
import CheckoutButton from "./checkout-button";
import AutoRefresh from "./auto-refresh";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string; required?: string; checkout?: string; portal?: string }>;
}) {
  const { limit, checkout, portal } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const LIMIT_MESSAGES: Record<string, string> = {
    license: "The free plan tracks one license. Upgrade to add more.",
    compliance:
      "E&O insurance and carrier appointment tracking are included on every paid plan.",
    agency: "Inviting team members requires the Agency or Agency Plus plan.",
  };
  const limitMessage = limit ? LIMIT_MESSAGES[limit] : undefined;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_name, status, renews_at, ends_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasActiveSubscription = subscription && ACTIVE_STATUSES.includes(subscription.status);

  // Posle plaćanja Polar nas vraća ovde sa ?checkout=success, ali webhook
  // upisuje pretplatu asinhrono - dok se ne pojavi, prikazujemo poruku i
  // automatski osvežavamo stranicu.
  const awaitingActivation = checkout === "success" && !hasActiveSubscription;

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

      <div className="max-w-270 mx-auto px-7 py-10">
        <Link
          href="/dashboard"
          className="text-[13.5px] text-(--muted) hover:text-(--ink) transition-colors"
        >
          ← Back to dashboard
        </Link>

        <h1 className="font-serif-brand text-[28px] font-semibold mt-4">Billing</h1>

        {awaitingActivation && (
          <div className="mt-4 rounded-md border border-(--line) bg-(--card) px-4 py-3 text-[13.5px] max-w-180">
            Thanks! Your payment went through. We&apos;re activating your plan, this page
            will update in a few seconds.
            <AutoRefresh />
          </div>
        )}

        {portal === "error" && (
          <div className="mt-4 rounded-md border border-(--line) bg-(--card) px-4 py-3 text-[13.5px] max-w-180">
            We couldn&apos;t open the subscription portal. Please try again, or email support.
          </div>
        )}

        {limitMessage && (
          <div
            className="mt-4 rounded-md border px-4 py-3 text-[13.5px] max-w-180"
            style={{ borderColor: "var(--amber)", background: "rgba(184,132,46,0.08)" }}
          >
            {limitMessage}
          </div>
        )}

        {hasActiveSubscription ? (
          <div className="mt-6 bg-(--card) border border-(--line) rounded-md p-6 max-w-180">
            <p className="text-[14px] text-(--muted)">Current plan</p>
            <p className="text-[19px] font-semibold mt-0.5">{subscription!.plan_name}</p>
            <p className="text-[13.5px] text-(--muted) mt-1">
              Status: {subscription!.status}
              {subscription!.ends_at
                ? `, ends ${new Date(subscription!.ends_at).toLocaleDateString()}`
                : subscription!.renews_at &&
                  `, renews ${new Date(subscription!.renews_at).toLocaleDateString()}`}
            </p>
            <div className="flex gap-4 mt-4">
              <a
                href="/api/billing/portal"
                className="text-[13.5px] underline hover:text-(--ink) text-(--muted)"
              >
                Manage subscription (payment method, cancel, invoices) →
              </a>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-[14.5px] text-(--muted)">
            You&apos;re not on a paid plan yet. Pick one below to subscribe.
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`bg-(--card) border rounded-xl p-7 flex flex-col ${
                plan.featured
                  ? "border-(--ink) shadow-[0_20px_40px_-28px_rgba(22,35,46,0.35)]"
                  : "border-(--line)"
              }`}
            >
              <div className="text-sm text-(--muted) font-medium">{plan.name}</div>
              <div className="font-serif-brand text-4xl my-2.5">
                {plan.price}
                <span className="text-[15px] text-(--muted) font-sans">/month</span>
              </div>
              <ul className="list-none p-0 m-0 mb-5 text-[13.5px] flex-1">
                {plan.features.map((feat, i) => (
                  <li
                    key={feat}
                    className={`py-1.5 ${i > 0 ? "border-t border-(--line)" : ""}`}
                  >
                    {feat}
                  </li>
                ))}
              </ul>
              <CheckoutButton
                productId={plan.productId}
                className={`self-start inline-block px-4.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  plan.featured
                    ? "bg-(--ink) text-(--paper) hover:opacity-90"
                    : "bg-transparent text-(--ink) border border-(--line) hover:bg-(--paper2) hover:border-(--ink)"
                }`}
              >
                {subscription?.plan_name === plan.name ? "Current plan" : "Subscribe"}
              </CheckoutButton>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
