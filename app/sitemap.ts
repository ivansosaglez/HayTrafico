import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/dgt/config";
import { CITIES } from "@/lib/incidents/cities";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "always", priority: 1 },
    ...CITIES.map((c) => ({
      url: `${SITE_URL}/trafico/${c.slug}`,
      changeFrequency: "always" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/fuentes`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
