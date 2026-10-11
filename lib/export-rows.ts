// lib/export-rows.ts
// Pretvara MemberOverview (isti podaci koje vidi dashboard) u redove za CSV.
// Koriste ga i lični export agenta i team export vlasnika agencije, pa su
// kolone iste.

import type { MemberOverview } from "@/lib/agency-overview";
import { getItemUrgency, ITEM_TYPE_LABELS } from "@/lib/compliance-status";

export const EXPORT_HEADER = [
  "Agent",
  "Record",
  "State",
  "Details",
  "Expiration date",
  "Days until expiration",
  "Status",
];

const LICENSE_STATUS_LABEL: Record<string, string> = {
  compliant: "Compliant",
  needs_hours: "Needs hours",
  at_risk: "At risk",
  expired: "Expired",
};

export type ExportRow = Array<string | number | null>;

export function overviewToRows(agent: string, overview: MemberOverview): ExportRow[] {
  const rows: ExportRow[] = [];

  for (const { license, status, daysUntilExpiration } of overview.licenses) {
    rows.push([
      agent,
      "License",
      license.state_code,
      license.license_type,
      license.expiration_date,
      daysUntilExpiration,
      status ? LICENSE_STATUS_LABEL[status] : "No rules on file",
    ]);
  }

  for (const item of overview.complianceItems) {
    const urgency = getItemUrgency(item.expiration_date);
    rows.push([
      agent,
      ITEM_TYPE_LABELS[item.item_type] ?? item.item_type,
      item.state_code,
      item.label,
      item.expiration_date,
      urgency.daysUntilExpiration,
      urgency.label,
    ]);
  }

  return rows;
}
