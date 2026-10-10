// lib/polar-plans.ts
// Jedan izvor istine za nazive planova i Polar Product ID-ove. Koristi ga
// billing stranica (da prikaže checkout dugmad), checkout ruta (da proveri da
// je tražen proizvod stvarno naš plan) i webhook (da product_id iz Polar
// eventa prevede u čitljiv plan_name za bazu).
// Product ID-ovi nisu tajna; env varijable služe samo da se mogu zameniti
// (npr. za sandbox) bez izmene koda.

export type PlanDefinition = {
  name: string;
  price: string;
  productId: string;
  features: string[];
  featured: boolean;
};

export const PLANS: PlanDefinition[] = [
  {
    name: "Independent Agent",
    price: "$15",
    productId:
      process.env.POLAR_PRODUCT_INDEPENDENT ?? "ff85629c-a0f8-4c4c-87e9-a94d4e64a390",
    features: [
      "1 agent",
      "Unlimited licenses, every state",
      "CE hours tracked by state rules",
      "E&O and carrier appointment tracking",
      "Reminders at 90, 60, 30, and 7 days",
      "Audit-ready PDF report",
      "Email support",
    ],
    featured: false,
  },
  {
    name: "Agency",
    price: "$99",
    productId: process.env.POLAR_PRODUCT_AGENCY ?? "1448213d-c3f6-42b1-971e-46a15f56fb6d",
    features: [
      "Up to 5 agents",
      "Owner dashboard: every agent's license and E&O status at a glance",
      "Everything in Independent Agent",
    ],
    featured: true,
  },
  {
    name: "Agency Plus",
    price: "$179",
    productId:
      process.env.POLAR_PRODUCT_AGENCY_PLUS ?? "d2ff30ad-8d08-4e85-92f7-129207f41492",
    features: ["Up to 15 agents", "Priority support", "Everything in Agency"],
    featured: false,
  },
];

// Webhook payload nosi product_id, ne čitljiv naziv - ovo ga prevodi u
// plan_name koji čuvamo u subscriptions tabeli.
export function planNameFromProductId(productId: string | null | undefined): string {
  if (!productId) return "Unknown plan";
  return PLANS.find((p) => p.productId === productId)?.name ?? "Unknown plan";
}
