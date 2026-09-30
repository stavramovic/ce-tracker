// lib/ce-calculator.ts
// Srce proizvoda: za datu licencu izračunava status usklađenosti.
// Ovo je logika koju generički alat (Excel, generički tracker) ne radi dobro —
// ovde je tvoja prava vrednost, ne u samom podsetniku.

type LicenseRow = {
  id: string;
  state_code: string;
  license_type: string;
  expiration_date: string; // ISO date
  years_licensed: number | null;
  sells_annuity: boolean;
  sells_ltc: boolean;
  sells_flood: boolean;
};

export type StateRule = {
  ce_hours_required: number;
  ethics_hours_required: number;
  renewal_cycle_months: number;
  special_requirements: Record<string, any> | null;
};

type CeCredit = {
  hours: number;
  category: string | null; // 'ethics' | 'general' | 'flood' | 'annuity' | 'ltc'
  completed_date: string;
};

export type ComplianceStatus = "compliant" | "needs_hours" | "at_risk" | "expired";

export interface ComplianceResult {
  status: ComplianceStatus;
  daysUntilExpiration: number;
  generalHoursCompleted: number;
  generalHoursRequired: number;
  ethicsHoursCompleted: number;
  ethicsHoursRequired: number;
  missingSpecial: string[]; // npr. ["flood", "annuity_refresher"]
}

export function calculateCompliance(
  license: LicenseRow,
  rule: StateRule,
  credits: CeCredit[]
): ComplianceResult {
  const today = new Date();
  const expiration = new Date(license.expiration_date);
  const daysUntilExpiration = Math.ceil(
    (expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Florida-tip logika: broj potrebnih sati zavisi od toga koliko dugo je agent licenciran
  let requiredHours = rule.ce_hours_required;
  const threshold = rule.special_requirements?.years_licensed_threshold;
  const reducedHours = rule.special_requirements?.hours_after_threshold;
  if (threshold && reducedHours && (license.years_licensed ?? 0) >= threshold) {
    requiredHours = reducedHours;
  }

  const generalHoursCompleted = sumHours(credits, (c) => c.category !== "ethics");
  const ethicsHoursCompleted = sumHours(credits, (c) => c.category === "ethics");

  // Posebni zahtevi po prodajnim linijama koje agent ima čekirane
  const missingSpecial: string[] = [];
  const special = rule.special_requirements ?? {};

  if (license.sells_flood && special.flood_hours) {
    const floodDone = sumHours(credits, (c) => c.category === "flood");
    if (floodDone < special.flood_hours) missingSpecial.push("flood");
  }
  if (license.sells_annuity && special.annuity_refresher_hours) {
    const annuityDone = sumHours(credits, (c) => c.category === "annuity");
    if (annuityDone < special.annuity_refresher_hours) missingSpecial.push("annuity_refresher");
  }
  if (license.sells_ltc && special.ltc_hours_year_1_to_4) {
    const ltcDone = sumHours(credits, (c) => c.category === "ltc");
    if (ltcDone < special.ltc_hours_year_1_to_4) missingSpecial.push("ltc");
  }

  const hoursOk =
    generalHoursCompleted + ethicsHoursCompleted >= requiredHours &&
    ethicsHoursCompleted >= rule.ethics_hours_required;

  let status: ComplianceStatus;
  if (daysUntilExpiration < 0) {
    status = "expired";
  } else if (!hoursOk || missingSpecial.length > 0) {
    status = daysUntilExpiration <= 30 ? "at_risk" : "needs_hours";
  } else if (daysUntilExpiration <= 30) {
    status = "at_risk"; // sati su ok, ali rok je blizu — svejedno upozori
  } else {
    status = "compliant";
  }

  return {
    status,
    daysUntilExpiration,
    generalHoursCompleted,
    generalHoursRequired: requiredHours - rule.ethics_hours_required,
    ethicsHoursCompleted,
    ethicsHoursRequired: rule.ethics_hours_required,
    missingSpecial,
  };
}

function sumHours(credits: CeCredit[], filter: (c: CeCredit) => boolean): number {
  return credits.filter(filter).reduce((sum, c) => sum + c.hours, 0);
}

// --------------------------------------------------------------------------
// Laka verzija za ANONIMNE posetioce (javne /states stranice) — nema licence
// u bazi, samo unos "koliko sati sam već odradio" preko forme. Bez datuma
// isteka, bez statusa — samo "koliko ti još fali".
// --------------------------------------------------------------------------

export interface HoursGapInput {
  generalHoursCompleted: number;
  ethicsHoursCompleted: number;
  yearsLicensed?: number;
  sellsAnnuity?: boolean;
  sellsLtc?: boolean;
  sellsFlood?: boolean;
  floodHoursCompleted?: number;
  annuityHoursCompleted?: number;
  ltcHoursCompleted?: number;
}

export interface HoursGapResult {
  requiredHours: number;
  ethicsRequired: number;
  generalRequired: number;
  generalRemaining: number;
  ethicsRemaining: number;
  missingSpecial: { key: string; hoursRequired: number; hoursRemaining: number }[];
  isCompliant: boolean;
}

export function calculateHoursGap(
  rule: StateRule,
  input: HoursGapInput
): HoursGapResult {
  const special = rule.special_requirements ?? {};

  let requiredHours = rule.ce_hours_required;
  const threshold = special.years_licensed_threshold;
  const reducedHours = special.hours_after_threshold;
  if (threshold && reducedHours && (input.yearsLicensed ?? 0) >= threshold) {
    requiredHours = reducedHours;
  }

  const ethicsRequired = rule.ethics_hours_required;
  const generalRequired = requiredHours - ethicsRequired;

  const generalRemaining = Math.max(0, generalRequired - input.generalHoursCompleted);
  const ethicsRemaining = Math.max(0, ethicsRequired - input.ethicsHoursCompleted);

  const missingSpecial: HoursGapResult["missingSpecial"] = [];

  if (input.sellsFlood && special.flood_hours) {
    const done = input.floodHoursCompleted ?? 0;
    const remaining = Math.max(0, special.flood_hours - done);
    if (remaining > 0) {
      missingSpecial.push({ key: "flood", hoursRequired: special.flood_hours, hoursRemaining: remaining });
    }
  }
  if (input.sellsAnnuity && special.annuity_refresher_hours) {
    const done = input.annuityHoursCompleted ?? 0;
    const remaining = Math.max(0, special.annuity_refresher_hours - done);
    if (remaining > 0) {
      missingSpecial.push({ key: "annuity", hoursRequired: special.annuity_refresher_hours, hoursRemaining: remaining });
    }
  }
  if (input.sellsLtc && special.ltc_hours_year_1_to_4) {
    const done = input.ltcHoursCompleted ?? 0;
    const remaining = Math.max(0, special.ltc_hours_year_1_to_4 - done);
    if (remaining > 0) {
      missingSpecial.push({ key: "long-term care", hoursRequired: special.ltc_hours_year_1_to_4, hoursRemaining: remaining });
    }
  }

  return {
    requiredHours,
    ethicsRequired,
    generalRequired,
    generalRemaining,
    ethicsRemaining,
    missingSpecial,
    isCompliant: generalRemaining === 0 && ethicsRemaining === 0 && missingSpecial.length === 0,
  };
}

// Za Pensilvaniju (renewal_basis: 'birth_month') datum isteka se NE računa
// od datuma izdavanja, nego od meseca rođenja agenta — ovu funkciju pozivaš
// pri unosu licence da izračunaš expiration_date koji se čuva u bazi.
export function calculateExpirationForBirthMonth(
  birthMonth: number, // 1-12
  cycleStartYear: number,
  cycleMonths: number
): Date {
  const targetYear = cycleStartYear + Math.floor(cycleMonths / 12);
  // poslednji dan meseca rođenja
  return new Date(targetYear, birthMonth, 0);
}