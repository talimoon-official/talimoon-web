/**
 * The permanent private Voice Memory page — the target of the QR code printed
 * in a personalized TALIMOON book: `https://www.talimoon.com/m/<token>`.
 *
 * PRIVATE by construction:
 *  - `robots: { index: false, follow: false }` + `X-Robots-Tag` on the data
 *    responses; never in the sitemap; no Open Graph / share metadata.
 *  - The token in the URL is the only capability; it is verified server-side
 *    by talimoon-intake and never leaves the server-to-server call.
 *  - Rendered dynamically, never cached.
 */

import type { Metadata } from "next";
import MemoryView, { MemoryNotFound } from "@/components/memory/MemoryView";
import { getPrivateMemory } from "@/lib/memory/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "A memory kept for you",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default async function MemoryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let memory = null;
  try {
    memory = await getPrivateMemory(token);
  } catch {
    memory = null;
  }
  if (!memory) return <MemoryNotFound />;
  return <MemoryView memory={memory} token={token} />;
}
