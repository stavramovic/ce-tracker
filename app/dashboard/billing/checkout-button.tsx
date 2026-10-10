// app/dashboard/billing/checkout-button.tsx
"use client";

import { useState } from "react";

export default function CheckoutButton({
  productId,
  children,
  className,
}: {
  productId: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server pravi Polar checkout sesiju (token ostaje na serveru) i vraća URL;
  // browser samo preusmerimo tamo. Polar nas posle plaćanja vraća na billing
  // stranicu (success_url), a pretplatu upisuje webhook.
  async function startCheckout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.url) {
        setError("Could not start checkout. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = json.url;
    } catch {
      setError("Could not start checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="self-start">
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className={`${className ?? ""} ${loading ? "opacity-60 cursor-wait" : ""}`}
      >
        {loading ? "Redirecting..." : children}
      </button>
      {error && <p className="text-[12.5px] text-(--red) mt-2">{error}</p>}
    </div>
  );
}
