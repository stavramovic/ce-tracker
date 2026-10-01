// app/dashboard/billing/checkout-button.tsx
"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
  }
}

export default function CheckoutButton({
  variantId,
  email,
  userId,
  children,
  className,
}: {
  variantId: string;
  email: string;
  userId: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    // Lemon.js presreće klikove na .lemonsqueezy-button linkove i otvara
    // overlay checkout umesto da pređe na novu stranicu. Učitaj samo jednom.
    if (document.getElementById("lemonsqueezy-js")) {
      window.createLemonSqueezy?.();
      return;
    }
    const script = document.createElement("script");
    script.id = "lemonsqueezy-js";
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;
    script.onload = () => window.createLemonSqueezy?.();
    document.body.appendChild(script);
  }, []);

  const storeSubdomain = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_SUBDOMAIN;

  if (!variantId || !storeSubdomain) {
    return (
      <button
        type="button"
        disabled
        className={`${className ?? ""} opacity-40 cursor-not-allowed`}
        title="Lemon Squeezy nije još podešen (nedostaje variant ID ili store subdomain)"
      >
        {children}
      </button>
    );
  }

  // custom[user_id] stiže nazad u webhook payload-u (meta.custom_data) i
  // tako povezujemo Lemon Squeezy pretplatu sa pravim korisnikom u bazi.
  const checkoutUrl =
    `https://${storeSubdomain}.lemonsqueezy.com/checkout/buy/${variantId}` +
    `?checkout[email]=${encodeURIComponent(email)}` +
    `&checkout[custom][user_id]=${encodeURIComponent(userId)}` +
    `&embed=1`;

  return (
    <a href={checkoutUrl} className={`lemonsqueezy-button ${className ?? ""}`}>
      {children}
    </a>
  );
}
