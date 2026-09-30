// lib/special-requirement-labels.ts
// calculateCompliance() vraća sirove kodove u missingSpecial ("flood",
// "annuity_refresher", "ltc") — ovo ih prevodi u čitljiv tekst za prikaz.

export const SPECIAL_REQUIREMENT_LABELS: Record<string, string> = {
  flood: "flood insurance training",
  annuity_refresher: "annuity refresher training",
  ltc: "long-term care training",
};

export function formatMissingSpecial(codes: string[]): string {
  return codes
    .map((code) => SPECIAL_REQUIREMENT_LABELS[code] ?? code)
    .join(", ");
}