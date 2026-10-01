// app/auth/confirm/actions.ts
// Server action koja stvarno trosi token_hash - samo na klik dugmeta
// (POST), nikad na obican GET/page-load. To je ono sto sprecava da
// mejl skeneri (Outlook Safe Links i slicno) slucajno potrose link.

"use server";

import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function confirmEmailAction(formData: FormData) {
  const token_hash = formData.get("token_hash") as string | null;
  const type = formData.get("type") as EmailOtpType | null;
  const next = (formData.get("next") as string | null) ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?error=auth_failed");
}