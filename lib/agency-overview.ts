// lib/agency-overview.ts
// Agregira compliance podatke za agenta u timu tako da ih owner moze da
// vidi sa agency stranice ("Owner dashboard across the team" obecanje sa
// landing page-a). Koristi admin klijenta namerno - owner nema i ne treba
// da ima RLS pristup tudjim redovima, ovaj fajl se zove SAMO posto je
// vec proveren vlasnik/clan odnos u server kodu koji ga poziva.

import { createAdminClient } from "@/lib/supabase/admin";
import { calculateCompliance, type ComplianceStatus } from "@/lib/ce-calculator";
import { getItemUrgency } from "@/lib/compliance-status";

export type MemberLicense = {
  id: string;
  state_code: string;
  license_type: string;
  expiration_date: string;
  years_licensed: number | null;
  sells_annuity: boolean;
  sells_ltc: boolean;
  sells_flood: boolean;
};

export type MemberLicenseRow = {
  license: MemberLicense;
  status: ComplianceStatus | null;
  daysUntilExpiration: number | null;
};

export type MemberComplianceItem = {
  id: string;
  item_type: string;
  label: string;
  state_code: string | null;
  expiration_date: string;
};

export type MemberOverview = {
  licenses: MemberLicenseRow[];
  complianceItems: MemberComplianceItem[];
  statusCounts: Record<ComplianceStatus, number>;
  nearestLicenseExpirationDays: number | null;
  itemsNeedingAttention: number; // compliance_items koji su expired ili expiring_soon
};

export async function getMemberOverview(userId: string): Promise<MemberOverview> {
  const admin = createAdminClient();

  const [{ data: licenses }, { data: complianceItems }] = await Promise.all([
    admin
      .from("licenses")
      .select(
        "id, state_code, license_type, expiration_date, years_licensed, sells_annuity, sells_ltc, sells_flood"
      )
      .eq("user_id", userId)
      .order("expiration_date", { ascending: true }),
    admin
      .from("compliance_items")
      .select("id, item_type, label, state_code, expiration_date")
      .eq("user_id", userId)
      .order("expiration_date", { ascending: true }),
  ]);

  const licenseRows = (licenses ?? []) as MemberLicense[];

  const withStatus = await Promise.all(
    licenseRows.map(async (license) => {
      const [{ data: rule }, { data: credits }] = await Promise.all([
        admin
          .from("state_rules")
          .select(
            "ce_hours_required, ethics_hours_required, renewal_cycle_months, special_requirements"
          )
          .eq("state_code", license.state_code)
          .eq("license_type", license.license_type)
          .single(),
        admin
          .from("ce_credits")
          .select("hours, category, completed_date")
          .eq("license_id", license.id),
      ]);

      const result = rule ? calculateCompliance(license, rule, credits ?? []) : null;

      return {
        license,
        status: result?.status ?? null,
        daysUntilExpiration: result?.daysUntilExpiration ?? null,
      };
    })
  );

  const statusCounts: Record<ComplianceStatus, number> = {
    compliant: 0,
    needs_hours: 0,
    at_risk: 0,
    expired: 0,
  };
  let nearestLicenseExpirationDays: number | null = null;

  for (const row of withStatus) {
    if (row.status) statusCounts[row.status]++;
    if (row.daysUntilExpiration !== null) {
      if (nearestLicenseExpirationDays === null || row.daysUntilExpiration < nearestLicenseExpirationDays) {
        nearestLicenseExpirationDays = row.daysUntilExpiration;
      }
    }
  }

  const items = (complianceItems ?? []) as MemberComplianceItem[];
  const itemsNeedingAttention = items.filter(
    (item) => getItemUrgency(item.expiration_date).urgency !== "active"
  ).length;

  return {
    licenses: withStatus,
    complianceItems: items,
    statusCounts,
    nearestLicenseExpirationDays,
    itemsNeedingAttention,
  };
}
