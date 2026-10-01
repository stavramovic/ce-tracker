// app/terms/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | LicensedRight",
  description: "Terms of Service for LicensedRight.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-(--paper)">
      <header className="border-b border-(--line)">
        <div className="max-w-180 mx-auto px-7 py-5">
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
        </div>
      </header>

      <div className="max-w-180 mx-auto px-7 py-12">
        <h1 className="font-serif-brand text-[30px] font-semibold mb-2">
          Terms of Service
        </h1>
        <p className="text-(--muted) text-[14px] mb-10">
          Last updated: October 1, 2026
        </p>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              1. Who runs this service
            </h2>
            <p>
              LicensedRight (available at getlicensedright.com) is operated by
              Stefan Avramović, an individual based in Serbia. In these Terms,
              &quot;we,&quot; &quot;us,&quot; and &quot;our&quot; refer to
              Stefan Avramović operating LicensedRight, and &quot;you&quot;
              refers to anyone who creates an account or otherwise uses the
              service. Questions about these Terms can be sent to{" "}
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
              2. What LicensedRight is (and isn&apos;t)
            </h2>
            <p>
              LicensedRight is a tracking tool that helps independent
              insurance agents keep track of continuing education (CE)
              hours, license renewal dates, E&O insurance, and carrier
              appointments across the states where they hold a license. You
              enter your own licensing information, and the service
              calculates deadlines and compliance status based on the state
              rules we maintain in our database.
            </p>
            <p className="mt-3">
              LicensedRight is <strong>not</strong> a law firm, an insurance
              regulator, or a substitute for professional or legal advice.
              State CE and licensing requirements change, and errors in our
              data are possible. You are solely responsible for confirming
              your compliance obligations directly with your state
              Department of Insurance or a qualified professional.
              LicensedRight is a tracking aid, not a guarantee of compliance.
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              3. Your account
            </h2>
            <p>
              You must be at least 18 years old to use LicensedRight. You are
              responsible for keeping access to your account (via the email
              address you sign in with) secure, and for the accuracy of the
              information you enter. You may delete your account at any time
              by contacting{" "}
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
              4. Pricing and early access
            </h2>
            <p>
              LicensedRight is currently in an early access period. Pricing
              shown on our website describes the plans we intend to offer,
              but at this time no payment processing is active and no
              account is being billed. If and when paid billing begins, we
              will notify existing users in advance and no one will be
              charged without clear notice and an opportunity to cancel.
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              5. Acceptable use
            </h2>
            <p>
              You agree not to misuse the service, including attempting to
              access other users&apos; data, disrupting the service,
              scraping it at scale, or using it for any unlawful purpose.
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              6. Service &quot;as is&quot;
            </h2>
            <p>
              The service is provided &quot;as is,&quot; without warranties
              of any kind. To the maximum extent permitted by law, we are
              not liable for any indirect, incidental, or consequential
              damages arising from your use of LicensedRight, including
              missed renewal deadlines, lapsed licenses, or regulatory
              penalties. Your use of the service to track compliance does
              not shift your personal responsibility for meeting your
              state&apos;s licensing and CE requirements.
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              7. Changes to these Terms
            </h2>
            <p>
              We may update these Terms from time to time. If we make
              material changes, we will update the date at the top of this
              page. Continuing to use LicensedRight after changes take
              effect means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              8. Governing law
            </h2>
            <p>
              These Terms are governed by the laws of the Republic of
              Serbia, without regard to conflict-of-law principles.
            </p>
          </section>

          <section>
            <h2 className="font-serif-brand text-[19px] font-semibold mb-2">
              9. Contact
            </h2>
            <p>
              Questions about these Terms? Reach us at{" "}
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