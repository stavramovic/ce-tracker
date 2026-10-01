// app/invite/[token]/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function acceptInviteAction(formData: FormData) {
  const token = formData.get("token") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/invite/${token}`);

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("agency_members")
    .select("id, email, joined_at")
    .eq("invite_token", token)
    .maybeSingle();

  if (!member) {
    redirect(`/invite/${token}?error=not_found`);
  }

  if (member.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    redirect(`/invite/${token}?error=email_mismatch`);
  }

  if (!member.joined_at) {
    const { error } = await admin
      .from("agency_members")
      .update({ user_id: user.id, joined_at: new Date().toISOString() })
      .eq("id", member.id);

    if (error) throw new Error(error.message);
  }

  redirect("/dashboard");
}
