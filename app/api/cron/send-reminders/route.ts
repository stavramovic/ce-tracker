// app/api/cron/send-reminders/route.ts
// Vercel Cron poziva ovo jednom dnevno (podešeno u vercel.json).
// Prolazi kroz licence SVIH korisnika koje ističu u narednih 90 dana i za
// svaku šalje podsetnik za najbliži prag (90/60/30/7) koji je već pređen —
// samo jednom po tipu po licenci (license_reminders_log to sprečava da duplira).
// Ne traži se TAČAN dan: ako cron jednog dana pukne, podsetnik ode sutradan.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLicenseReminderEmail } from "@/lib/resend";

// Od najmanjeg ka najvećem — find() vraća najbliži pređeni prag, pa licenca
// na 5 dana dobija samo 7-dnevni podsetnik, ne i sve propuštene pre njega.
const THRESHOLDS: { days: number; type: string }[] = [
  { days: 7, type: "7_day" },
  { days: 30, type: "30_day" },
  { days: 60, type: "60_day" },
  { days: 90, type: "90_day" },
];

const MAX_THRESHOLD_DAYS = 90;

function isoDateOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const target = new Date(dateStr);
  const targetUTC = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  return Math.round((targetUTC - todayUTC) / (1000 * 60 * 60 * 24));
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: licenses, error } = await supabase
    .from("licenses")
    .select("id, user_id, state_code, license_type, expiration_date")
    .gte("expiration_date", isoDateOffset(0))
    .lte("expiration_date", isoDateOffset(MAX_THRESHOLD_DAYS));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { license_id: string; reminder_type: string; status: string }[] = [];

  for (const license of licenses ?? []) {
    const days = daysUntil(license.expiration_date);
    if (days < 0) continue;
    const threshold = THRESHOLDS.find((t) => days <= t.days);
    if (!threshold) continue;

    const { data: existing } = await supabase
      .from("license_reminders_log")
      .select("id")
      .eq("license_id", license.id)
      .eq("reminder_type", threshold.type)
      .maybeSingle();

    if (existing) continue;

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