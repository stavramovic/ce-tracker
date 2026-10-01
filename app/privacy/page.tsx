// app/privacy/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | LicensedRight",
  description: "Privacy Policy for LicensedRight.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-(--paper)">
      <header className="border-b border-(--line)">
        <div className="max-w-180 mx-auto px-7 py-5 min-h-20 flex items-center">
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
        </div>
      </header>

      <div className="max-w-180 mx-auto px-7 py-12">
        <h1 className="font-serif-brand text-[30px] font-semibold mb-2">
          Privacy Policy
        </h1>
        <p className="text-(--muted) text-[14px] mb-10">
          Last updated: October 1, 2026
        </p>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              1. Who this policy covers
            </h2>
            <p>
              This Privacy Policy explains how LicensedRight, operated by
              Stefan Avramović (Serbia), collects, uses, and protects your
              information. If you have questions, contact{" "}
              <a
                href="mailto:avmtechnologies2026@gmail.com"
                className="underline"
              >
                avmtechnologies2026@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              2. What we collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Account information:</strong> the email address you
                use to sign in (we use passwordless &quot;magic link&quot;
                sign-in, so we never see or store a password).
              </li>
              <li>
                <strong>License and compliance data you enter:</strong>{" "}
                state, license type, expiration dates, CE hours completed,
                E&O insurance details, and carrier appointment details.
              </li>
              <li>
                <strong>Basic technical data:</strong> standard server logs
                (such as IP address and browser type) generated automatically
                by our hosting provider.
              </li>
            </ul>
            <p className="mt-3">
              We do not collect payment information at this time, because no
              billing is active during early access (see our Terms of
              Service).
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              3. How we use your data
            </h2>
            <p>
              We use your data solely to operate the service: calculating
              your compliance status, sending you email reminders about
              upcoming license, CE, E&O, or carrier appointment deadlines,
              and maintaining your account. We do not sell your data, and we
              do not use it for advertising or share it with data brokers.
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              4. Who we share data with
            </h2>
            <p>
              We use a small number of third-party service providers to run
              LicensedRight, each of which processes data on our behalf under
              their own security and privacy commitments:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>
                <strong>Supabase</strong>: hosts our database and handles
                authentication.
              </li>
              <li>
                <strong>Resend</strong>: delivers our transactional email
                reminders.
              </li>
              <li>
                <strong>Vercel</strong>: hosts the application itself.
              </li>
            </ul>
            <p className="mt-3">
              We do not share your license or compliance data with insurance
              carriers, state regulators, or any other third party.
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              5. Data retention
            </h2>
            <p>
              We keep your data for as long as your account is active. If
              you ask us to delete your account, we will delete your
              personal data and the license/compliance records tied to it,
              except where we are required to retain limited records by law.
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              6. Your rights
            </h2>
            <p>
              You can request a copy of the data we hold about you, ask us
              to correct it, or ask us to delete your account and data
              entirely, by emailing{" "}
              <a
                href="mailto:avmtechnologies2026@gmail.com"
                className="underline"
              >
                avmtechnologies2026@gmail.com
              </a>
              . We will respond within a reasonable time.
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              7. Cookies
            </h2>
            <p>
              We use only the minimum cookies required to keep you signed in
              securely. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              8. Changes to this policy
            </h2>
            <p>
              If we make material changes to this policy, we will update
              the date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              9. Contact
            </h2>
            <p>
              Questions about this policy or your data? Reach us at{" "}
              <a
                href="mailto:avmtechnologies2026@gmail.com"
                className="underline"
              >
                avmtechnologies2026@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}