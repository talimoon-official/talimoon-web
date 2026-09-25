"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearPlanIntent, peekPlanIntent } from "@/lib/order/planIntent";
import PersonalizedBookOrderForm from "@/components/begin/PersonalizedBookOrderForm";

/**
 * Thin client wrapper so the route can hand the EXISTING
 * `PersonalizedBookOrderForm` an `onBack` handler. "Back" from the
 * form's first screen returns to the previous journey step — the
 * pricing route — not to `/begin`.
 *
 * The book type chosen one step earlier (PersonalizedBookEntry, or a
 * PricingSection card) arrives through the in-memory plan intent and
 * pre-seeds the form's child count; the market is preserved by the
 * existing `useMarketPreference` mechanism the form already reads.
 */
export default function PersonalizedBookFormRoute() {
  const router = useRouter();
  // The book type chosen on the entry step / product page (memory only).
  // Peeked on first render, cleared after mount — so a later visit to the
  // form starts clean. Absent -> the form asks for the child count itself.
  const [initialBookType] = useState(peekPlanIntent);
  useEffect(() => clearPlanIntent(), []);
  return (
    <PersonalizedBookOrderForm
      initialBookType={initialBookType}
      onBack={() => router.push("/begin/personalized-book/price")}
    />
  );
}
