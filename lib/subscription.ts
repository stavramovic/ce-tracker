// lib/subscription.ts
// Centralna logika za "ko ima plaćen pristup". Koristi admin klijent jer
// agency provera mora da pogleda tuđu (owner-ovu) pretplatu, što RLS ne
// dozvoljava normalnom (user-scoped) klijentu.

import { createAdminClient } from "@/lib/supabase/admin";

// Polar statusi (subscription.status): incomplete, trialing, active,
// past_due, canceled, unpaid. Pretplata otkazana na kraju perioda ostaje
// "active" do tog datuma (cancel_at_period_end). Ako se ikad promeni provider
// sa drugim nazivima, ovo je jedino mesto za izmenu.
export const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

// Besplatan tier: prva licenca je besplatna (vidi "Free for your first
// license" na landing page-u), E&O/appointment tracking i druga+ licenca
// traže plaćen plan.
export const FREE_LICENSE_LIMIT = 1;

export function getSeatLimit(planName: string | null | undefined): number {
  if (planName === "Agency Plus") return 15;
  if (planName === "Agency") return 5;
  return 0;
}

async function hasOwnActiveSubscription(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return !!data && ACTIVE_STATUSES.includes(data.status);
}

// Agenti pridruženi agenciji dobijaju pristup preko owner-ove pretplate,
// bez sopstvenog plaćanja.
async function hasAgencyAccess(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", userId)
    .not("joined_at", "is", null)
    .maybeSingle();

  if (!membership) return false;

  const { data: agency } = await admin
    .from("agencies")
    .select("owner_id")
    .eq("id", membership.agency_id)
    .maybeSingle();

  if (!agency) return false;

  return hasOwnActiveSubscription(agency.owner_id);
}

export async function hasPaidAccess(userId: string): Promise<boolean> {
  if (await hasOwnActiveSubscription(userId)) return true;
  return hasAgencyAccess(userId);
}
