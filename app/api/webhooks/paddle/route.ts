// app/api/webhooks/paddle/route.ts
// Paddle šalje POST na ovu rutu za svaki subscription event (created,
// updated, canceled, itd). Moramo da čitamo RAW body (ne JSON parsed) da bi
// HMAC potpis mogao ispravno da se proveri - zato je request.text(), ne
// request.json(). Format potpisa i verifikacija:
// https://developer.paddle.com/webhooks/about/signature-verification/

import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planNameFromPriceId } from "@/lib/paddle-plans";

function isValidSignature(rawBody: string, header: string, secret: string): boolean {
  // Paddle-Signature: "ts=1671552777;h1=<hex>"
  const parts = Object.fromEntries(
    header.split(";").map((p) => p.split("=") as [string, string])
  );
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const signedPayload = `${ts}:${rawBody}`;
  const computed = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  const computedBuffer = Buffer.from(computed, "utf8");
  const h1Buffer = Buffer.from(h1, "utf8");

  return (
    computedBuffer.length === h1Buffer.length && crypto.timingSafeEqual(computedBuffer, h1Buffer)
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("paddle-signature") ?? "";

  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("PADDLE_WEBHOOK_SECRET nije podešen");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!isValidSignature(rawBody, signatureHeader, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventType = payload?.event_type as string | undefined;
  const data = payload?.data;

  if (!eventType || !data) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  // Zanimaju nas samo subscription.* eventi (created/updated/activated/
  // canceled/past_due/paused svi nose isti "subscription" data oblik, pa
  // jedan upsert pokriva sve).
  if (eventType.startsWith("subscription.")) {
    const userId = data.custom_data?.user_id as string | undefined;
    const subscriptionId = data.id as string | undefined;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    if (!userId) {
      // Nemamo kome da pripišemo pretplatu (custom_data nije stigao iz
      // checkout-a). Logujemo i vraćamo 200 da Paddle ne pokušava retry
      // unedogled - ovo bi trebalo istražiti ručno ako se desi.
      console.error("Paddle webhook: nema custom_data.user_id za subscription", subscriptionId);
      return NextResponse.json({ received: true });
    }

    const priceId = data.items?.[0]?.price?.id as string | undefined;
    const scheduledCancel =
      data.scheduled_change?.action === "cancel" ? data.scheduled_change.effective_at : null;

    const admin = createAdminClient();

    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        paddle_subscription_id: subscriptionId,
        paddle_customer_id: data.customer_id ?? null,
        price_id: priceId ?? "",
        plan_name: planNameFromPriceId(priceId),
        status: data.status ?? "unknown",
        renews_at: data.next_billed_at ?? null,
        ends_at: scheduledCancel,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_subscription_id" }
    );

    if (error) {
      console.error("Upis pretplate nije uspeo:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
