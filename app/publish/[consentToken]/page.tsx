/**
 * Post-delivery publication consent — the page a customer reaches from the
 * unique link TALIMOON sends after their book is DELIVERED.
 *
 * This grants TALIMOON Publication Consent v1: a SEPARATE, versioned,
 * explicitly-scoped consent to show the final-page words publicly in the
 * Story Library. It is never bundled with the order/privacy consent, and it
 * cannot be initiated before delivery. Private, no-index, never cached.
 */

import type { Metadata } from "next";
import PublishConsentForm from "@/components/memory/PublishConsentForm";
import { getConsentReview } from "@/lib/memory/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TALIMOON Publication Consent",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PublishConsentPage({
  params,
}: {
  params: Promise<{ consentToken: string }>;
}) {
  const { consentToken } = await params;
  let review = null;
  try {
    review = await getConsentReview(consentToken);
  } catch {
    review = null;
  }
  return (
    <main className="min-h-dvh bg-[#f6f1e7]">
      <PublishConsentForm token={consentToken} review={review} />
    </main>
  );
}
