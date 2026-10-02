// app/dashboard/billing/checkout-button.tsx
"use client";

import { useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

export default function CheckoutButton({
  priceId,
  email,
  userId,
  children,
  className,
}: {
  priceId: string;
  email: string;
  userId: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [paddle, setPaddle] = useState<Paddle>();

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const environment = process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox";

  useEffect(() => {
    if (!token || paddle) return;
    initializePaddle({ environment, token }).then((instance) => {
      if (instance) setPaddle(instance);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!priceId || !token) {
    return (
      <button
        type="button"
        disabled
        className={`${className ?? ""} opacity-40 cursor-not-allowed`}
        title="Paddle nije još podešen (nedostaje price ID ili client token)"
      >
        {children}
      </button>
    );
  }

  // customData.user_id stiže nazad u webhook payload-u (data.custom_data) i
  // tako povezujemo Paddle pretplatu sa pravim korisnikom u bazi.
  function openCheckout() {
    paddle?.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email },
      customData: { user_id: userId },
    });
  }

  return (
    <button type="button" onClick={openCheckout} disabled={!paddle} className={className}>
      {children}
    </button>
  );
}
