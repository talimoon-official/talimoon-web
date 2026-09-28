"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearPlanIntent, peekPlanIntent } from "@/lib/order/planIntent";
import { ENTRY_PATH, PRICE_PATH } from "@/lib/order/paths";
import { markReturnedToMenu } from "@/lib/order/menuReturn";
import { createFormHistoryGuard, type FormHistoryGuard } from "@/lib/order/formHistoryGuard";
import { FlowBackProvider, type FlowBackRegistry } from "@/components/begin/FlowBack";
import PersonalizedBookOrderForm from "@/components/begin/PersonalizedBookOrderForm";

/**
 * Thin client wrapper around the EXISTING `PersonalizedBookOrderForm`:
 *
 *  - "Back" from the form's first screen returns to the previous journey
 *    step — the book-type choice — not to `/begin`. When the customer came
 *    from that choice in this tab it steps back through history (no
 *    duplicate entry, no form→price→form loop); after a reload / direct
 *    landing there is no such entry, so it replaces with the price page.
 *  - Browser / system Back runs the current screen's own Back action
 *    (lib/order/formHistoryGuard) instead of leaving the form and losing
 *    everything typed.
 *  - After the order is saved, the saved screen returns to the order menu
 *    (auto-return / system Back) with a history REPLACE, so Back from the
 *    menu never reopens the completed form.
 *
 * The book type chosen one step earlier (PersonalizedBookPlans, or a
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

  const registry: FlowBackRegistry = useRef<(() => void) | null>(null);
  const guard = useRef<FormHistoryGuard | null>(null);
  // A plan intent means the customer came here by a client navigation from
  // a pricing choice, so that page is right behind the form in history.
  const cameFromPricing = initialBookType != null;

  useEffect(() => {
    const g = createFormHistoryGuard({
      history: window.history,
      target: window,
      onSystemBack: () => registry.current?.(),
      fallbackLeave: cameFromPricing ? null : () => router.replace(PRICE_PATH),
    });
    guard.current = g;
    return () => {
      g.dispose();
      if (guard.current === g) guard.current = null;
    };
  }, [cameFromPricing, router]);

  function leaveToPricing() {
    if (guard.current) guard.current.leave();
    else router.replace(PRICE_PATH);
  }

  function returnToMenu() {
    guard.current?.release();
    markReturnedToMenu();
    router.replace(ENTRY_PATH);
  }

  return (
    <FlowBackProvider registry={registry}>
      <PersonalizedBookOrderForm
        initialBookType={initialBookType}
        onBack={leaveToPricing}
        onReturnToMenu={returnToMenu}
      />
    </FlowBackProvider>
  );
}
