// app/dashboard/billing/auto-refresh.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Posle uspešnog plaćanja webhook upisuje pretplatu asinhrono (obično za
// nekoliko sekundi). Dok se to ne desi, osvežavamo server-rendered deo
// stranice na par sekundi, najviše nekoliko puta.
export default function AutoRefresh({ intervalMs = 3000, maxTries = 8 }) {
  const router = useRouter();

  useEffect(() => {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      router.refresh();
      if (tries >= maxTries) clearInterval(timer);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [router, intervalMs, maxTries]);

  return null;
}
