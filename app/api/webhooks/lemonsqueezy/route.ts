// app/api/webhooks/lemonsqueezy/route.ts
// Lemon Squeezy šalje POST na ovu rutu za svaki subscription event (created,
// updated, cancelled, itd). Moramo da čitamo RAW body (ne JSON parsed) da bi
// HMAC potpis mogao ispravno da se proveri - zato je request.text(), ne
// request.json().

import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET nije podešen");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const expectedHmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedHmac, "utf8");

  const isValid =
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload?.meta?.event_name as string | undefined;
  const userId = payload?.meta?.custom_data?.user_id as string | undefined;
  const data = payload?.data;
  const attrs = data?.attributes ?? {};
  const subscriptionId = data?.id as string | undefined;

  if (!eventName || !subscriptionId) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  // Zanimaju nas samo subscription_* eventi (created/updated/cancelled/
  // resumed/expired/paused/unpaused/payment_success/payment_failed svi
  // nose isti "subscriptions" data oblik pa jedan upsert pokriva sve).
  if (eventName.startsWith("subscription_")) {
    if (!userId) {
      // Nemamo kome da pripišemo pretplatu (custom_data nije stigao iz
      // checkout linka). Logujemo i vraćamo 200 da LS ne pokušava retry
      // unedogled - ovo bi trebalo istražiti ručno ako se desi.
      console.error(
        "Lemon Squeezy webhook: nema custom_data.user_id za subscription",
        subscriptionId
      );
      return NextResponse.json({ received: true });
    }

    const admin = createAdminClient();

    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        ls_subscription_id: subscriptionId,
        ls_customer_id: attrs.customer_id != null ? String(attrs.customer_id) : null,
        ls_order_id: attrs.order_id != null ? String(attrs.order_id) : null,
        variant_id: attrs.variant_id != null ? String(attrs.variant_id) : "",
        plan_name: attrs.variant_name ?? "",
        status: attrs.status ?? "unknown",
        renews_at: attrs.renews_at ?? null,
        ends_at: attrs.ends_at ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ls_subscription_id" }
    );

    if (error) {
      console.error("Upis pretplate nije uspeo:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
