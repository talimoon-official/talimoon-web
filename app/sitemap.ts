import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE = "https://www.talimoon.com";

/**
 * PUBLIC pages only. Private Voice Memory pages (`/m/<token>`), publication
 * consent pages (`/publish/<token>`), `/aloqa`, the `/begin` order funnel and
 * the per-story reader are deliberately absent — a private Memory must never
 * be discoverable through the sitemap, a public index, or SEO metadata.
 *
 * The public "Words Left for a Child" category (`/story-library/words`) is
 * listed, but individual published memories under `/story-library/words/<slug>`
 * are not enumerated here: they are added and revoked by customer consent and
 * a stale sitemap entry for a since-revoked memory must never linger.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    "",
    "/about",
    "/journey",
    "/products/personalized-books",
    "/products/talimoon-toys",
    "/products/yusuf-and-yasmina",
    "/story-library",
    "/story-library/families",
    "/story-library/yusuf-yasmina",
    "/story-library/words",
    "/privacy",
    "/terms",
    "/contact",
  ];
  return paths.map((p) => ({
    url: `${SITE}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.6,
  }));
}
