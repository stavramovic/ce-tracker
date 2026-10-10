// lib/polar-api.ts
// Mali helper za server-side pozive ka Polar REST API-ju. Koristi se samo na
// serveru (token nikad ne ide u browser). POLAR_SERVER=sandbox prebacuje na
// sandbox okruženje; bez toga ide production.

const POLAR_API_BASE =
  process.env.POLAR_SERVER === "sandbox"
    ? "https://sandbox-api.polar.sh"
    : "https://api.polar.sh";

async function polarFetch(path: string, body: unknown): Promise<Response> {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) {
    throw new Error("POLAR_ACCESS_TOKEN nije podešen");
  }

  return fetch(`${POLAR_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

// Pravi checkout sesiju. external_customer_id vezuje Polar customer-a za
// našeg korisnika (user.id), a metadata.user_id se kopira na pretplatu, pa
// webhook zna kome da je pripiše.
export async function createCheckoutUrl(params: {
  productId: string;
  userId: string;
  email: string;
  successUrl: string;
  returnUrl: string;
}): Promise<string | null> {
  const res = await polarFetch("/v1/checkouts/", {
    products: [params.productId],
    external_customer_id: params.userId,
    customer_email: params.email,
    metadata: { user_id: params.userId },
    success_url: params.successUrl,
    return_url: params.returnUrl,
  });

  if (!res.ok) {
    console.error("Polar checkout nije uspeo:", res.status, await res.text());
    return null;
  }

  const json = await res.json();
  return typeof json?.url === "string" ? json.url : null;
}

// Customer portal: Polar-ov hostovani ekran za promenu kartice, otkazivanje,
// račune. Link je kratkotrajan, pa se pravi na zahtev (nikad se ne kešira).
export async function createCustomerPortalUrl(params: {
  userId: string;
  returnUrl: string;
}): Promise<string | null> {
  const res = await polarFetch("/v1/customer-sessions/", {
    external_customer_id: params.userId,
    return_url: params.returnUrl,
  });

  if (!res.ok) {
    console.error("Polar customer session nije uspeo:", res.status, await res.text());
    return null;
  }

  const json = await res.json();
  return typeof json?.customer_portal_url === "string" ? json.customer_portal_url : null;
}
