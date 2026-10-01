// app/dashboard/agency/actions.ts
"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAgencyInviteEmail } from "@/lib/resend";
import { getSeatLimit } from "@/lib/subscription";

const SITE_URL = "https://getlicensedright.com";

// Vraća owner-ov plan_name (ili null) iz subscriptions tabele, koristi se
// da se izračuna seat limit dinamički, bez čuvanja zastarele vrednosti.
async function getOwnerPlanName(ownerId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("plan_name, status")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || !["active", "on_trial", "past_due"].includes(data.status)) {
    return null;
  }
  return data.plan_name;
}

export async function inviteMember(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const planName = await getOwnerPlanName(user.id);
  const seatLimit = getSeatLimit(planName);

  if (seatLimit === 0) {
    // Nije na Agency/Agency Plus planu - ne sme da poziva članove.
    redirect("/dashboard/billing?limit=agency");
  }

  const email = (formData.get("email") as string).trim().toLowerCase();
  if (!email) {
    throw new Error("Email is required");
  }

  const admin = createAdminClient();

  // Nađi ili napravi agency red za ovog owner-a.
  const { data: existingAgency } = await admin
    .from("agencies")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  let agency: { id: string; name: string };

  if (existingAgency) {
    agency = existingAgency;
  } else {
    const { data: created, error: createError } = await admin
      .from("agencies")
      .insert({ owner_id: user.id, name: `${user.email}'s Agency` })
      .select("id, name")
      .single();

    if (createError || !created) {
      throw new Error(createError?.message ?? "Failed to create agency");
    }
    agency = created;
  }

  const { count } = await admin
    .from("agency_members")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agency.id);

  if ((count ?? 0) >= seatLimit) {
    throw new Error(
      `You've reached your plan's seat limit (${seatLimit}). Remove a member or upgrade to invite more.`
    );
  }

  const inviteToken = randomUUID();

  const { error: insertError } = await admin.from("agency_members").insert({
    agency_id: agency.id,
    email,
    invite_token: inviteToken,
  });

  if (insertError) {
    // unique(agency_id, email) violation = već pozvan
    throw new Error(
      insertError.code === "23505"
        ? "This email has already been invited."
        : insertError.message
    );
  }

  await sendAgencyInviteEmail({
    to: email,
    agencyName: agency.name,
    inviteUrl: `${SITE_URL}/invite/${inviteToken}`,
  });

  revalidatePath("/dashboard/agency");
}

export async function removeMember(memberId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: agency } = await admin
    .from("agencies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!agency) redirect("/dashboard/agency");

  // Briši samo ako red stvarno pripada OVOM owner-u (ne veruj samo memberId-u).
  const { error } = await admin
    .from("agency_members")
    .delete()
    .eq("id", memberId)
    .eq("agency_id", agency.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/agency");
}
