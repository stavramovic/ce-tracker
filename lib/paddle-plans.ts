// lib/paddle-plans.ts
// Jedan izvor istine za nazive planova i Paddle Price ID-ove. Koristi ga i
// billing stranica (da prikaže checkout dugmad) i webhook (da price_id iz
// Paddle eventa prevede u čitljiv plan_name za bazu) - ako se cena/naziv
// promeni, menja se samo ovde.

export type PlanDefinition = {
  name: string;
  price: string;
  priceId: string;
  features: string[];
  featured: boolean;
};

export const PLANS: PlanDefinition[] = [
  {
    name: "Independent Agent",
    price: "$15",
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_INDEPENDENT ?? "",
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
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_AGENCY ?? "",
    features: ["Up to 5 agents", "Owner dashboard across the team", "Everything in Independent Agent"],
    featured: true,
  },
  {
    name: "Agency Plus",
    price: "$179",
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_AGENCY_PLUS ?? "",
    features: ["Up to 15 agents", "Priority support", "Everything in Agency"],
    featured: false,
  },
];

// Webhook payload nosi price_id (npr. item.price.id), ne čitljiv naziv -
// ovo ga prevodi u plan_name koji čuvamo u subscriptions tabeli.
export function planNameFromPriceId(priceId: string | null | undefined): string {
  if (!priceId) return "Unknown plan";
  return PLANS.find((p) => p.priceId === priceId)?.name ?? "Unknown plan";
}
