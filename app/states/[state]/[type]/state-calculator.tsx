// app/states/[state]/[type]/state-calculator.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { calculateHoursGap, type StateRule } from "@/lib/ce-calculator";

export default function StateCalculator({ rule }: { rule: StateRule }) {
  const special = rule.special_requirements ?? {};

  const [general, setGeneral] = useState("");
  const [ethics, setEthics] = useState("");
  const [yearsLicensed, setYearsLicensed] = useState("");
  const [sellsFlood, setSellsFlood] = useState(false);
  const [sellsAnnuity, setSellsAnnuity] = useState(false);
  const [sellsLtc, setSellsLtc] = useState(false);
  const [floodHours, setFloodHours] = useState("");
  const [annuityHours, setAnnuityHours] = useState("");
  const [ltcHours, setLtcHours] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calculateHoursGap> | null>(
    null
  );

  function handleCalculate() {
    setResult(
      calculateHoursGap(rule, {
        generalHoursCompleted: parseFloat(general) || 0,
        ethicsHoursCompleted: parseFloat(ethics) || 0,
        yearsLicensed: yearsLicensed ? parseInt(yearsLicensed, 10) : undefined,
        sellsFlood,
        sellsAnnuity,
        sellsLtc,
        floodHoursCompleted: parseFloat(floodHours) || 0,
        annuityHoursCompleted: parseFloat(annuityHours) || 0,
        ltcHoursCompleted: parseFloat(ltcHours) || 0,
      })
    );
  }

  return (
    <div className="bg-(--card) border border-(--line) rounded-xl p-6">
      <h2 className="font-serif-brand text-xl font-semibold">
        How many hours do you still need?
      </h2>
      <p className="mt-1.5 text-[14px] text-(--muted)">
        Enter what you&apos;ve completed so far; no account needed.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-medium mb-1.5">
            General hours completed
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={general}
            onChange={(e) => setGeneral(e.target.value)}
            className="w-full rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] outline-none focus:border-(--ink) transition-colors bg-(--card)"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium mb-1.5">
            Ethics hours completed
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={ethics}
            onChange={(e) => setEthics(e.target.value)}
            className="w-full rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] outline-none focus:border-(--ink) transition-colors bg-(--card)"
          />
        </div>
      </div>

      {special.years_licensed_threshold ? (
        <div className="mt-4">
          <label className="block text-[13px] font-medium mb-1.5">
            Years licensed (optional)
          </label>
          <input
            type="number"
            min="0"
            value={yearsLicensed}
            onChange={(e) => setYearsLicensed(e.target.value)}
            placeholder={`${special.years_licensed_threshold}+ years reduces your requirement`}
            className="w-full rounded-md border border-(--line) px-3.5 py-2.5 text-[14.5px] outline-none focus:border-(--ink) transition-colors bg-(--card)"
          />
        </div>
      ) : null}

      {(special.flood_hours || special.annuity_refresher_hours || special.ltc_hours_year_1_to_4) && (
        <div className="mt-5 pt-5 border-t border-(--line)">
          <p className="text-[13px] font-medium mb-2.5">
            Do you sell any of these? (extra hours may apply)
          </p>
          <div className="flex flex-col gap-3">
            {special.flood_hours ? (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-[14px] w-40">
                  <input
                    type="checkbox"
                    checked={sellsFlood}
                    onChange={(e) => setSellsFlood(e.target.checked)}
                  />
                  Flood insurance
                </label>
                {sellsFlood && (
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="hours completed"
                    value={floodHours}
                    onChange={(e) => setFloodHours(e.target.value)}
                    className="rounded-md border border-(--line) px-3 py-1.5 text-[13.5px] outline-none focus:border-(--ink) transition-colors bg-(--card) w-36"
                  />
                )}
              </div>
            ) : null}
            {special.annuity_refresher_hours ? (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-[14px] w-40">
                  <input
                    type="checkbox"
                    checked={sellsAnnuity}
                    onChange={(e) => setSellsAnnuity(e.target.checked)}
                  />
                  Annuities
                </label>
                {sellsAnnuity && (
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="hours completed"
                    value={annuityHours}
                    onChange={(e) => setAnnuityHours(e.target.value)}
                    className="rounded-md border border-(--line) px-3 py-1.5 text-[13.5px] outline-none focus:border-(--ink) transition-colors bg-(--card) w-36"
                  />
                )}
              </div>
            ) : null}
            {special.ltc_hours_year_1_to_4 ? (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-[14px] w-40">
                  <input
                    type="checkbox"
                    checked={sellsLtc}
                    onChange={(e) => setSellsLtc(e.target.checked)}
                  />
                  Long-term care
                </label>
                {sellsLtc && (
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="hours completed"
                    value={ltcHours}
                    onChange={(e) => setLtcHours(e.target.value)}
                    className="rounded-md border border-(--line) px-3 py-1.5 text-[13.5px] outline-none focus:border-(--ink) transition-colors bg-(--card) w-36"
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <button
        onClick={handleCalculate}
        className="mt-5 rounded-md bg-(--ink) text-(--paper) px-4 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity"
      >
        Calculate what I still need
      </button>

      {result && (
        <div className="mt-5 pt-5 border-t border-(--line)">
          {result.isCompliant ? (
            <p className="text-[15px] font-medium" style={{ color: "var(--green)" }}>
              You&apos;re fully compliant; nothing left to complete.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {result.generalRemaining > 0 && (
                <p className="text-[14.5px]">
                  <strong>{result.generalRemaining}h</strong> more general
                  hours needed
                </p>
              )}
              {result.ethicsRemaining > 0 && (
                <p className="text-[14.5px]">
                  <strong>{result.ethicsRemaining}h</strong> more ethics
                  hours needed
                </p>
              )}
              {result.missingSpecial.map((m) => (
                <p key={m.key} className="text-[14.5px]">
                  <strong>{m.hoursRemaining}h</strong> more {m.key} hours
                  needed
                </p>
              ))}
            </div>
          )}

          <div className="mt-4 bg-(--paper2) rounded-md p-4">
            <p className="text-[13.5px] text-(--muted)">
              Want this tracked automatically, with reminders before your
              renewal date?
            </p>
            <Link
              href="/login"
              className="inline-block mt-2.5 rounded-md bg-(--ink) text-(--paper) px-4 py-2 text-[13.5px] font-medium hover:opacity-90 transition-opacity"
            >
              Track this license free
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}