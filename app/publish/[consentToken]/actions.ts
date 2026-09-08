"use server";

import { submitPublicationConsent, type PublicationScope } from "@/lib/memory/api";

export interface GrantResult {
  ok: boolean;
  status: number;
  slug?: string;
  reason?: "not_delivered" | "already_public" | "not_found" | "error";
}

/**
 * Record the customer's explicit, scoped grant of TALIMOON Publication
 * Consent v1. Only ever reached from an affirmative submit on the consent
 * page — `agree` is enforced client-side AND the intake endpoint rejects a
 * request without it. Silence is never consent.
 */
export async function grantConsent(
  token: string,
  scope: PublicationScope,
): Promise<GrantResult> {
  const res = await submitPublicationConsent(token, scope);
  if (res.ok) return { ok: true, status: res.status, slug: res.slug };
  const reason =
    res.status === 409
      ? "already_public"
      : res.status === 400 || res.status === 409
        ? "not_delivered"
        : res.status === 404
          ? "not_found"
          : "error";
  return { ok: false, status: res.status, reason };
}
