import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE = "https://www.talimoon.com";

/**
 * Private Voice Memory pages (`/m/<token>`), the post-delivery publication
 * consent pages (`/publish/<token>`), the staff contact deep-link page
 * (`/aloqa`), the order funnel and the per-story reader are all NON-public
 * and must never be crawled or indexed. `/m/` also carries `X-Robots-Tag:
 * noindex` on every response and appears in no sitemap — this is the
 * belt-and-braces first line.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/m/",
          "/publish/",
          "/aloqa",
          "/begin/",
          "/story-library/read/",
          "/story-library/s/",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
