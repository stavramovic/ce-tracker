// app/sitemap.ts
// Next.js automatski servira ovo na /sitemap.xml — Google ga koristi
// da otkrije i indeksira sve stranice, uključujući sve /states kombinacije.

import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { licenseTypeToSlug } from "@/lib/state-slugs";

const SITE_URL = "https://getlicensedright.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: rules } = await supabase
    .from("state_rules")
    .select("state_code, license_type");

  const stateRoutes: MetadataRoute.Sitemap = (rules ?? []).map((rule) => ({
    url: `${SITE_URL}/states/${rule.state_code.toLowerCase()}/${licenseTypeToSlug(
      rule.license_type
    )}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/states`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...stateRoutes,
  ];
}