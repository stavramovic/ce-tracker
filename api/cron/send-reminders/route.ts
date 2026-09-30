// app/api/cron/send-reminders/route.ts
// Vercel Cron poziva ovo jednom dnevno (podešeno u vercel.json).
// Prolazi kroz SVE licence SVIH korisnika, i za svaku koja je tačno na
// 90/60/30/7 dana do isteka šalje mejl podsetnik — ali samo jednom po
// tipu po licenci (license_reminders_log to sprečava da duplira).

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLicenseReminderEmail } from "@/lib/resend";

const THRESHOLDS: { days: number; type: string }[] = [
  { days: 90, type: "90_day" },
  { days: 60, type: "60_day" },
  { days: 30, type: "30_day" },
  { days: 7, type: "7_day" },
];

function daysUntil(dateStr: string): number {
  const today = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET(request: Request) {
  // Zaštita: samo Vercel Cron (koji šalje ovaj header) sme da pozove ovo,
  // ne bilo ko ko pogodi URL.
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: licenses, error } = await supabase
    .from("licenses")
    .select("id, user_id, state_code, license_type, expiration_date");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { license_id: string; reminder_type: string; status: string }[] = [];

  for (const license of licenses ?? []) {
    const days = daysUntil(license.expiration_date);
    const threshold = THRESHOLDS.find((t) => t.days === days);
    if (!threshold) continue; // nije tačno na jedan od naših pragova danas

    // Da li je već poslat ovaj tip podsetnika za ovu licencu?
    const { data: existing } = await supabase
      .from("license_reminders_log")
      .select("id")
      .eq("license_id", license.id)
      .eq("reminder_type", threshold.type)
      .maybeSingle();

    if (existing) continue; // već poslato, preskoči

    // Nađi email korisnika preko admin auth API-ja
    const { data: userData } = await supabase.auth.admin.getUserById(license.user_id);
    const email = userData?.user?.email;
    if (!email) continue;

    try {
      await sendLicenseReminderEmail({
        to: email,
        stateCode: license.state_code,
        licenseType: license.license_type,
        daysUntilExpiration: days,
        reminderType: threshold.type,
        dashboardUrl: `https://getlicensedright.com/dashboard/${license.id}`,
      });

      await supabase.from("license_reminders_log").insert({
        license_id: license.id,
        reminder_type: threshold.type,
      });

      results.push({ license_id: license.id, reminder_type: threshold.type, status: "sent" });
    } catch (err) {
      results.push({
        license_id: license.id,
        reminder_type: threshold.type,
        status: `failed: ${err instanceof Error ? err.message : "unknown error"}`,
      });
    }
  }

  return NextResponse.json({ checked: licenses?.length ?? 0, results });
}