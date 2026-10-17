import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { buildSeed } from "@/data/seed";
import { ARTICLES } from "@/data/content";

// Only real, public, indexable routes. Private areas (dashboards, learning, orders, certificates) are excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const seed = buildSeed();
  const fixed = ["", "/courses", "/instructors/amir-kavian", "/about", "/contact", "/faq", "/resources", "/verify", "/install", "/privacy", "/terms"];
  return [
    ...fixed.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...seed.courses.filter((c) => c.status === "published").map((c) => ({ url: `${SITE.url}/courses/${c.slug}`, lastModified: c.createdAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...ARTICLES.map((a) => ({ url: `${SITE.url}/resources/${a.slug}`, lastModified: a.publishedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
