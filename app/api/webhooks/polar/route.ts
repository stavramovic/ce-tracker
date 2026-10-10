// app/api/webhooks/polar/route.ts
// Polar šalje POST na ovu rutu za svaki subscription event. Potpis prati
// Standard Webhooks specifikaciju: headeri webhook-id, webhook-timestamp,
// webhook-signature, a potpisuje se `${id}.${timestamp}.${rawBody}` sa
// HMAC-SHA256. Zato čitamo RAW body (request.text()), ne request.json().
// Proveru radimo ručno (bez SDK-a) jer je kodiranje secreta u SDK-u bilo
// izvor grešaka; probamo sve poznate varijante ključa izvedene iz istog
// secreta (vidi signingKeys).

import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planNameFromProductId } from "@/lib/polar-plans";

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

// Samo polja pretplate koja nam trebaju (ostatak payload-a ignorišemo).
type PolarSubscription = {
  id?: string;
  status?: string;
  product_id?: string;
  product?: { id?: string };
  customer_id?: string;
  customer?: { external_id?: string | null };
  metadata?: Record<string, unknown>;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  ends_at?: string | null;
};

// Standard Webhooks: secret oblika "whsec_<base64>" -> ključ su base64-dekodirani
// bajtovi. Polar je dokumentovano koristio i sirove UTF-8 bajtove secreta,
// pa proveravamo oba (i varijantu bez "whsec_" prefiksa) - sve su izvedene iz
// istog secreta, tako da ne slabi proveru.
function signingKeys(secret: string): Buffer[] {
  const keys: Buffer[] = [];

  if (secret.startsWith("whsec_")) {
    keys.push(Buffer.from(secret.slice("whsec_".length), "base64"));
  }
  keys.push(Buffer.from(secret, "utf8"));
  if (secret.startsWith("whsec_")) {
    keys.push(Buffer.from(secret.slice("whsec_".length), "utf8"));
  }

  return keys;
}

function isValidSignature(
  rawBody: string,
  id: string,
  timestamp: string,
  signatureHeader: string,
  secret: string
): boolean {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > TIMESTAMP_TOLERANCE_SECONDS) {
    return false;
  }

  // Header: "v1,<base64> v1,<base64>" (može više potpisa, odvojeni razmakom)
  const provided = signatureHeader
    .split(" ")
    .map((part) => part.split(",")[1])
    .filter((sig): sig is string => !!sig)
    .map((sig) => Buffer.from(sig, "base64"));

  if (provided.length === 0) return false;

  const signedContent = `${id}.${timestamp}.${rawBody}`;

  for (const key of signingKeys(secret)) {
    const expected = crypto.createHmac("sha256", key).update(signedContent, "utf8").digest();
    for (const sig of provided) {
      if (sig.length === expected.length && crypto.timingSafeEqual(sig, expected)) {
        return true;
      }
    }
  }

  return false;
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("POLAR_WEBHOOK_SECRET nije podešen");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const id = request.headers.get("webhook-id") ?? "";
  const timestamp = request.headers.get("webhook-timestamp") ?? "";
  const signature = request.headers.get("webhook-signature") ?? "";

  if (!id || !timestamp || !signature || !isValidSignature(rawBody, id, timestamp, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { type?: string; data?: PolarSubscription };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const eventType = payload.type;
  const data = payload.data;

  if (!eventType || !data) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  // Zanimaju nas samo subscription.* eventi (created/updated/active/canceled/
  // uncanceled/revoked nose isti "subscription" oblik, pa jedan upsert
  // pokriva sve).
  if (eventType.startsWith("subscription.")) {
    const subscriptionId = data.id;
    if (!subscriptionId) {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    // Checkout upisuje user_id u metadata (kopira se na pretplatu); kao
    // rezervu koristimo external_id customer-a, koji je takođe user.id.
    const metaUserId = data.metadata?.user_id;
    const userId =
      (typeof metaUserId === "string" ? metaUserId : undefined) ??
      data.customer?.external_id ??
      undefined;

    if (!userId) {
      // Nemamo kome da pripišemo pretplatu. Vraćamo 200 da Polar ne ponavlja
      // isporuku unedogled; ovo treba istražiti ručno ako se desi.
      console.error("Polar webhook: nema user_id za subscription", subscriptionId);
      return NextResponse.json({ received: true });
    }

    const productId = data.product_id ?? data.product?.id;
    const periodEnd = data.current_period_end ?? null;
    const cancelAtPeriodEnd = data.cancel_at_period_end === true;

    const admin = createAdminClient();

    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        polar_subscription_id: subscriptionId,
        polar_customer_id: data.customer_id ?? null,
        product_id: productId ?? "",
        plan_name: planNameFromProductId(productId),
        status: data.status ?? "unknown",
        renews_at: periodEnd,
        // Otkazana pretplata važi do kraja plaćenog perioda.
        ends_at: cancelAtPeriodEnd ? periodEnd : (data.ends_at ?? null),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "polar_subscription_id" }
    );

    if (error) {
      console.error("Upis pretplate nije uspeo:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
