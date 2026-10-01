"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ENTRY_PATH, FORM_PATH, PRICE_PATH } from "@/lib/order/paths";
import { clearOpenedFromMenu, markReturnedToMenu, peekOpenedFromMenu } from "@/lib/order/menuReturn";
import { clearOrderDraft, loadOrderDraft } from "@/components/begin/orderDraft";
import { resolveDraftLoad } from "@/components/begin/draftLoad";
import ResumeChoice from "@/components/begin/ResumeChoice";

/** If storage never answers, go on to a fresh order rather than wait forever. */
const LOAD_TIMEOUT_MS = 2500;

/**
 * Client side of /begin/personalized-book/resume.
 *
 *  - Loads + fully restores the local draft first (the same checks the form
 *    applies). None / expired / corrupt → REPLACE to the pricing page: the
 *    normal start of a new order, with no dead entry left in history.
 *  - "Davom ettirish" → REPLACE to the form, which reopens the draft on its
 *    saved step (no plan intent = no second question). History stays
 *    [menu, form] — no loop back to this screen.
 *  - "Ha, yangi boshlayman" → deletes ONLY the local draft (answers + media),
 *    then REPLACE to the pricing page. Nothing on this screen talks to the
 *    backend: no order, no finalize, no payment code, no Telegram.
 *  - Back → the order menu (a history step when we came from it, else a
 *    replace), and the browser / system Back does the same naturally.
 */
export default function ResumeChoiceRoute() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [fromMenu] = useState(peekOpenedFromMenu);
  useEffect(() => clearOpenedFromMenu(), []);

  useEffect(() => {
    let live = true;
    const toPricing = () => router.replace(PRICE_PATH);
    const timeout = window.setTimeout(() => {
      live = false;
      toPricing();
    }, LOAD_TIMEOUT_MS);
    void loadOrderDraft().then((loaded) => {
      if (!live) return;
      window.clearTimeout(timeout);
      const r = resolveDraftLoad(loaded, undefined);
      if (r.restored) {
        setReady(true);
        return;
      }
      if (r.discard) void clearOrderDraft();
      toPricing();
    });
    return () => {
      live = false;
      window.clearTimeout(timeout);
    };
  }, [router]);

  if (!ready) {
    // Same footprint as the choice; nothing to read yet.
    return <section data-order-flow="" aria-busy="true" className="min-h-[560px] bg-surface-base" />;
  }

  return (
    <ResumeChoice
      onBack={() => {
        markReturnedToMenu();
        if (fromMenu) router.back();
        else router.replace(ENTRY_PATH);
      }}
      onContinue={() => router.replace(FORM_PATH)}
      onStartNew={() => {
        void clearOrderDraft().then(() => router.replace(PRICE_PATH));
      }}
    />
  );
}
