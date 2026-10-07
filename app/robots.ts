// app/robots.ts
// Next.js automatski servira ovo na /robots.txt.
// Dozvoljava sve crawlere svuda osim /dashboard (privatni deo, nema šta
// da se indeksira tamo), i eksplicitno pokazuje gde je sitemap.

import type { MetadataRoute } from "next";

const SITE_URL = "https://www.getlicensedright.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}