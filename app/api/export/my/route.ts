// app/api/export/my/route.ts
// CSV export svih licenci, E&O i carrier appointment-a ulogovanog agenta.
// Dostupno na svim planovima (to su njegovi sopstveni podaci).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMemberOverview } from "@/lib/agency-overview";
import { toCsv, csvResponse } from "@/lib/csv";
import { EXPORT_HEADER, overviewToRows } from "@/lib/export-rows";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${new URL(request.url).origin}/login`);
  }

  // user.id dolazi iz proverene sesije, pa je admin klijent unutar
  // getMemberOverview bezbedan za ovaj poziv.
  const overview = await getMemberOverview(user.id);
  const csv = toCsv(EXPORT_HEADER, overviewToRows(user.email ?? "me", overview));

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `licensedright-${date}.csv`);
}
