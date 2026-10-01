"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPaidAccess } from "@/lib/subscription";

export async function addComplianceItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // E&O/carrier appointment tracking nije deo besplatnog tier-a (samo prva
  // licenca jeste) - traži aktivan plan.
  if (!(await hasPaidAccess(user.id))) {
    redirect("/dashboard/billing?limit=compliance");
  }

  const item_type = formData.get("item_type") as string;
  const label = formData.get("label") as string;
  const state_code = (formData.get("state_code") as string) || null;
  const expiration_date = formData.get("expiration_date") as string;
  const notes = (formData.get("notes") as string) || null;
  const document_url = (formData.get("document_url") as string) || null;

  const { error } = await supabase.from("compliance_items").insert({
    user_id: user.id,
    item_type,
    label,
    state_code,
    expiration_date,
    notes,
    document_url,
    status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateComplianceItem(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const item_type = formData.get("item_type") as string;
  const label = formData.get("label") as string;
  const state_code = (formData.get("state_code") as string) || null;
  const expiration_date = formData.get("expiration_date") as string;
  const notes = (formData.get("notes") as string) || null;
  const document_url = (formData.get("document_url") as string) || null;

  const { error } = await supabase
    .from("compliance_items")
    .update({
      item_type,
      label,
      state_code,
      expiration_date,
      notes,
      document_url,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteComplianceItem(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("compliance_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}