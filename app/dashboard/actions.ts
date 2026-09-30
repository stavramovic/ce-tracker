// app/dashboard/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addLicense(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const state_code = formData.get("state_code") as string;
  const license_type = formData.get("license_type") as string;
  const expiration_date = formData.get("expiration_date") as string;
  const years_licensed_raw = formData.get("years_licensed") as string;

  const { error } = await supabase.from("licenses").insert({
    user_id: user.id,
    state_code,
    license_type,
    expiration_date,
    years_licensed: years_licensed_raw ? parseInt(years_licensed_raw, 10) : null,
    sells_annuity: formData.get("sells_annuity") === "true",
    sells_ltc: formData.get("sells_ltc") === "true",
    sells_flood: formData.get("sells_flood") === "true",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}