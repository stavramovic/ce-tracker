// lib/compliance-status.ts
export type ComplianceItemUrgency = "active" | "expiring_soon" | "expired";

export function getItemUrgency(expirationDate: string): {
  urgency: ComplianceItemUrgency;
  daysUntilExpiration: number;
  label: string;
  color: string;
} {
  const today = new Date();
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const target = new Date(expirationDate);
  const targetUTC = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const daysUntilExpiration = Math.round((targetUTC - todayUTC) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiration < 0) {
    return { urgency: "expired", daysUntilExpiration, label: "Expired", color: "var(--red)" };
  }
  if (daysUntilExpiration <= 60) {
    return { urgency: "expiring_soon", daysUntilExpiration, label: "Expiring soon", color: "var(--amber)" };
  }
  return { urgency: "active", daysUntilExpiration, label: "Active", color: "var(--green)" };
}

export const ITEM_TYPE_LABELS: Record<string, string> = {
  eo_insurance: "E&O Insurance",
  carrier_appointment: "Carrier Appointment",
};