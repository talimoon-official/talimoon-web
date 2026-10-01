"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clearPlanIntent, peekPlanIntent } from "@/lib/order/planIntent";
import { ENTRY_PATH, PRICE_PATH } from "@/lib/order/paths";
import { markReturnedToMenu } from "@/lib/order/menuReturn";
import { createFormHistoryGuard, type FormHistoryGuard } from "@/lib/order/formHistoryGuard";
import { FlowBackProvider, type FlowBackRegistry } from "@/components/begin/FlowBack";
import PersonalizedBookOrderForm from "@/components/begin/PersonalizedBookOrderForm";
import { clearOrderDraft, loadOrderDraft, type RestoredOrderDraft } from "@/components/begin/orderDraft";
import { resolveDraftLoad } from "@/components/begin/draftLoad";
import ResumeChoice from "@/components/begin/ResumeChoice";

/**
 * Thin client wrapper around the EXISTING `PersonalizedBookOrderForm`:
 *
 *  - Loads the unfinished order saved on this device (IndexedDB, see
 *    components/begin/orderDraft) BEFORE the form renders, so the form opens
 *    straight on the saved step — no flash of the first question.
 *  - When the customer arrives having just chosen a plan (pricing page /
 *    product page) while an unfinished order is saved, asks first
 *    (ResumeChoice): continue the saved order as it was, or — after one
 *    confirmation — delete it and start the chosen plan fresh. Two drafts
 *    are never merged. (From the order menu the same question is asked
 *    earlier, on /begin/personalized-book/resume.)
 *  - A draft that cannot be rendered (e.g. written by an incompatible
 *    build) is discarded and the form restarts clean — never a crash loop.
 *  - "Back" from the form's first screen returns to the book-type choice
 *    (history step, or replace after a reload / direct landing); browser /
 *    system Back runs the current screen's own Back (formHistoryGuard).
 *  - After the order is saved, the saved screen returns to the order menu
 *    with a history REPLACE.
 */

type Load =
  | { status: "loading" }
  | { status: "ready"; restored: RestoredOrderDraft | null }
  | { status: "choose"; restored: RestoredOrderDraft };

/** If storage never answers, open a fresh form rather than wait forever. */
const LOAD_TIMEOUT_MS = 2500;

export default function PersonalizedBookFormRoute() {
  const router = useRouter();
  // The book type chosen on the entry step / product page (memory only).
  // Peeked on first render, cleared after mount — so a later visit to the
  // form starts clean. Absent -> the form asks for the child count itself.
  const [initialBookType] = useState(peekPlanIntent);
  useEffect(() => clearPlanIntent(), []);

  const [load, setLoad] = useState<Load>({ status: "loading" });
  useEffect(() => {
    let live = true;
    const timeout = window.setTimeout(() => {
      if (live) setLoad((s) => (s.status === "loading" ? { status: "ready", restored: null } : s));
    }, LOAD_TIMEOUT_MS);
    void loadOrderDraft().then((loaded) => {
      if (!live) return;
      window.clearTimeout(timeout);
      const r = resolveDraftLoad(loaded, initialBookType);
      if (r.discard) void clearOrderDraft();
      setLoad((s) => {
        if (s.status !== "loading") return s;
        return r.ask && r.restored
          ? { status: "choose", restored: r.restored }
          : { status: "ready", restored: r.restored };
      });
    });
    return () => {
      live = false;
      window.clearTimeout(timeout);
    };
  }, [initialBookType]);

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

  let body: ReactNode;
  if (load.status === "loading") {
    // Same footprint as the form's first screen; nothing to read yet.
    body = <section data-order-flow="" aria-busy="true" className="min-h-[560px] bg-surface-base" />;
  } else if (load.status === "choose") {
    const draft = load.restored;
    body = (
      <ResumeChoice
        onBack={leaveToPricing}
        onContinue={() => setLoad({ status: "ready", restored: draft })}
        onStartNew={() => {
          // Confirmed NEW order: the old answers AND all its stored media
          // are deleted first, then a fresh form opens on the chosen plan.
          void clearOrderDraft().then(() => setLoad({ status: "ready", restored: null }));
        }}
      />
    );
  } else {
    const restored = load.restored;
    const form = (
      <PersonalizedBookOrderForm
        initialBookType={restored ? undefined : initialBookType}
        restored={restored}
        onBack={leaveToPricing}
        onReturnToMenu={returnToMenu}
      />
    );
    body = restored ? (
      <DraftSafetyNet
        key="restored"
        onFail={() => {
          void clearOrderDraft();
          setLoad({ status: "ready", restored: null });
        }}
      >
        {form}
      </DraftSafetyNet>
    ) : (
      <div key="fresh">{form}</div>
    );
  }

  return <FlowBackProvider registry={registry}>{body}</FlowBackProvider>;
}

/**
 * Only around a RESTORED draft: if rendering it throws, the draft is
 * discarded and a fresh form mounts in its place. A fresh form is never
 * wrapped, so its own errors still reach the app's error handling.
 */
class DraftSafetyNet extends Component<
  { children: ReactNode; onFail: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
