// app/dashboard/settings/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteAccountAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Brisanje mora ići u ovom redosledu zbog FK veza ka auth.users i
  // licenses koje nemaju ON DELETE CASCADE (isti problem na koji smo
  // naleteli dok smo ručno brisali test nalog preko SQL-a).
  const { data: licenses } = await admin
    .from("licenses")
    .select("id")
    .eq("user_id", user.id);

  const licenseIds = (licenses ?? []).map((l) => l.id as string);

  if (licenseIds.length > 0) {
    await admin.from("license_reminders_log").delete().in("license_id", licenseIds);
    await admin.from("ce_credits").delete().in("license_id", licenseIds);
  }

  await admin.from("licenses").delete().eq("user_id", user.id);
  await admin.from("compliance_items").delete().eq("user_id", user.id);

  // profiles tabela možda ne postoji za svaki nalog (npr. kreiran pre nego
  // što je tabela dodata) - ne rušimo celu akciju zbog toga.
  try {
    await admin.from("profiles").delete().eq("id", user.id);
  } catch {
    // ignorišemo - nije kritično ako profiles red ne postoji
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error(error.message);
  }

  await supabase.auth.signOut();
  redirect("/");
}
