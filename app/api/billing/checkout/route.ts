// app/api/billing/checkout/route.ts
// Billing stranica poziva ovu rutu kad korisnik klikne "Subscribe". Ruta
// proverava da je korisnik ulogovan i da je traženi proizvod stvarno jedan od
// naših planova, pa traži checkout URL od Polar-a i vraća ga browseru.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutUrl } from "@/lib/polar-api";
import { PLANS } from "@/lib/polar-plans";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let productId: unknown;
  try {
    ({ productId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof productId !== "string" || !PLANS.some((p) => p.productId === productId)) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;

  try {
    const url = await createCheckoutUrl({
      productId,
      userId: user.id,
      email: user.email ?? "",
      successUrl: `${origin}/dashboard/billing?checkout=success`,
      returnUrl: `${origin}/dashboard/billing`,
    });

    if (!url) {
      return NextResponse.json({ error: "Could not start checkout" }, { status: 502 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Checkout greška:", error);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
