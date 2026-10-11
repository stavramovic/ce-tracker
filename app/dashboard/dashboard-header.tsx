// app/dashboard/dashboard-header.tsx
// Jedan header za sve dashboard stranice (iste dimenzije i isti linkovi
// svuda, da se ne "pomera" pri navigaciji). Settings ga namerno ne koristi.

import Link from "next/link";
import SignOutButton from "./sign-out-button";

const NAV_LINKS = [
  { href: "/dashboard/agency", label: "Team" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardHeader({ email }: { email?: string | null }) {
  return (
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
          {email && <span className="text-[13.5px] text-(--muted)">{email}</span>}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13.5px] text-(--muted) hover:text-(--ink) transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
