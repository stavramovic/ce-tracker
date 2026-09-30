// app/dashboard/[id]/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addCredit(licenseId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hours = parseFloat(formData.get("hours") as string);
  const category = formData.get("category") as string;
  const course_name = (formData.get("course_name") as string) || null;
  const completed_date = formData.get("completed_date") as string;

  const { error } = await supabase.from("ce_credits").insert({
    license_id: licenseId,
    hours,
    category,
    course_name,
    completed_date,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/${licenseId}`);
}