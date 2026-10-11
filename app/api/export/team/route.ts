// app/api/export/team/route.ts
// CSV export za vlasnika agencije: licence, E&O i appointment-i svih
// prihvacenih clanova tima. Dostupno samo owner-u sa aktivnim Agency /
// Agency Plus planom (isti uslov kao Team stranica).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACTIVE_STATUSES, getSeatLimit } from "@/lib/subscription";
import { getMemberOverview } from "@/lib/agency-overview";
import { toCsv, csvResponse } from "@/lib/csv";
import { EXPORT_HEADER, overviewToRows, type ExportRow } from "@/lib/export-rows";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${new URL(request.url).origin}/login`);
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_name, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isActive = !!subscription && ACTIVE_STATUSES.includes(subscription.status);
  if (!isActive || getSeatLimit(subscription!.plan_name) === 0) {
    return NextResponse.json({ error: "Agency plan required" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: agency } = await admin
    .from("agencies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!agency) {
    return NextResponse.json({ error: "No agency found" }, { status: 404 });
  }

  const { data: members } = await admin
    .from("agency_members")
    .select("user_id, email, joined_at")
    .eq("agency_id", agency.id)
    .order("invited_at", { ascending: true });

  const rows: ExportRow[] = [];

  for (const member of members ?? []) {
    if (member.joined_at && member.user_id) {
      const overview = await getMemberOverview(member.user_id);
      rows.push(...overviewToRows(member.email, overview));
    } else {
      rows.push([member.email, "Invite pending", null, null, null, null, "Invite pending"]);
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(EXPORT_HEADER, rows), `licensedright-team-${date}.csv`);
}
