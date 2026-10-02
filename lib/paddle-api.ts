// lib/paddle-api.ts
// Mali helper za server-side pozive ka Paddle REST API-ju. Trenutno koristi
// se samo da se povuku management_urls (update payment method / cancel) za
// billing stranicu - Paddle te linkove NAMERNO ne salje kroz webhook (kratko
// traju), pa se moraju povuci live, na zahtev, preko API-ja.

const PADDLE_API_BASE =
  process.env.PADDLE_ENV === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";

export type SubscriptionManagementUrls = {
  updatePaymentMethod: string | null;
  cancel: string | null;
};

export async function getSubscriptionManagementUrls(
  paddleSubscriptionId: string
): Promise<SubscriptionManagementUrls | null> {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${PADDLE_API_BASE}/subscriptions/${paddleSubscriptionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = await res.json();
    const urls = json?.data?.management_urls;
    if (!urls) return null;

    return {
      updatePaymentMethod: urls.update_payment_method ?? null,
      cancel: urls.cancel ?? null,
    };
  } catch (error) {
    console.error("Paddle management_urls fetch failed:", error);
    return null;
  }
}
