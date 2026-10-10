// app/api/billing/portal/route.ts
// "Manage subscription" link na billing stranici vodi ovde. Pravimo svež
// Polar customer portal link (kratko traje) i odmah preusmeravamo korisnika.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCustomerPortalUrl } from "@/lib/polar-api";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const url = await createCustomerPortalUrl({
      userId: user.id,
      returnUrl: `${origin}/dashboard/billing`,
    });

    if (url) {
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("Customer portal greška:", error);
  }

  return NextResponse.redirect(`${origin}/dashboard/billing?portal=error`);
}
