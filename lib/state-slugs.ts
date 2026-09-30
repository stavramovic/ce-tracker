// lib/state-slugs.ts
// "P&C" ne može da ide direktno u URL, pa mapiramo u/iz čitljivih slug-ova.
// Ako dodaš novi license_type u state_rules, dodaj mapiranje i ovde.

const SLUG_TO_TYPE: Record<string, string> = {
  pc: "P&C",
  life: "Life",
  "personal-lines": "Personal Lines",
};

const TYPE_TO_SLUG: Record<string, string> = {
  "P&C": "pc",
  Life: "life",
  "Personal Lines": "personal-lines",
};

export function slugToLicenseType(slug: string): string | null {
  return SLUG_TO_TYPE[slug] ?? null;
}

export function licenseTypeToSlug(type: string): string {
  return TYPE_TO_SLUG[type] ?? type.toLowerCase().replace(/\s+/g, "-");
}

export const STATE_NAMES: Record<string, string> = {
  CA: "California",
  TX: "Texas",
  FL: "Florida",
  NY: "New York",
  PA: "Pennsylvania",
  IL: "Illinois",
  OH: "Ohio",
  GA: "Georgia",
  NC: "North Carolina",
  WA: "Washington",
  MI: "Michigan",
  NJ: "New Jersey",
  VA: "Virginia",
  AZ: "Arizona",
  TN: "Tennessee",
};