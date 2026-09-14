"use client";

/**
 * TALIMOON homepage entrance experience — reusable shell.
 *
 * Four-screen sequence (01 attention -> 02 behavior reset -> 03
 * redefine TALIMOON -> 04 curiosity), all inside one IntroPanelShell
 * instance that stays mounted for the intro's whole lifetime — only
 * the active screen's content swaps underneath it, so the panel never
 * remounts or jumps between steps.
 *
 * First-visit state: `useIntroVisibility` (lib/intro/useIntroVisibility.ts)
 * gates on a `talimoon-intro-seen` localStorage flag, the same pattern
 * already used by the PWA install prompt. Dev/QA reset: clear that key,
 * or open the homepage with `?intro=1` to force it open regardless.
 * Completion is now only persisted from Screen 04's CTA (`handleFinish`)
 * — reaching Screens 02/03 never marks the intro seen, so a visitor who
 * closes the tab mid-sequence sees Screen 01 again next visit.
 *
 * No close/skip control by design (spec §10/§28) — the one way out is
 * each screen's own CTA. A manual Tab-cycle trap (same approach as
 * Navbar's mobile drawer and the Story Library reader) keeps keyboard
 * focus inside the intro instead of falling through to the blurred
 * homepage behind it; Escape is intentionally left doing nothing.
 * After a step change, focus moves to the incoming screen's heading
 * (every screen shares the `tm-intro-heading` id, one mounted at a
 * time) so screen readers announce the new content without leaving a
 * stale announcement loop.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useIntroVisibility } from "@/lib/intro/useIntroVisibility";
import { IntroPanelShell } from "./IntroPanelShell";
import { IntroScreenOne } from "./IntroScreenOne";
import { IntroScreenTwo } from "./IntroScreenTwo";
import { IntroScreenThree } from "./IntroScreenThree";
import { IntroScreenFour } from "./IntroScreenFour";

const EASE = [0.16, 1, 0.3, 1] as const;

type Step = 1 | 2 | 3 | 4;

export function HomeIntroExperience() {
  const { visible, complete } = useIntroVisibility();
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>(1);
  // Guards rapid double-clicks on a CTA from advancing more than one
  // step or firing `complete()` twice (spec §46) — cleared once the
  // step transition has had time to finish.
  const advancingRef = useRef(false);

  useEffect(() => {
    if (!visible) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    containerRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !containerRef.current) return;

      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href]'
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [visible]);

  // Move focus to the new screen's heading on every step change except
  // the very first render (the effect above already focused the intro
  // container itself when it opened on Screen 01).
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (!visible) return;
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    containerRef.current
      ?.querySelector<HTMLElement>("#tm-intro-heading")
      ?.focus();
  }, [step, visible]);

  if (!visible) return null;

  function advanceTo(next: Step) {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setStep(next);
    window.setTimeout(() => {
      advancingRef.current = false;
    }, 400);
  }

  function handleFinish() {
    if (advancingRef.current) return;
    advancingRef.current = true;
    complete();
  }

  const stageVariants = reduced
    ? undefined
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tm-intro-heading"
      tabIndex={-1}
      className="fixed inset-0 z-[1000] outline-none"
    >
      <IntroPanelShell>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            variants={stageVariants}
            initial={reduced ? false : "initial"}
            animate="animate"
            exit={reduced ? undefined : "exit"}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {step === 1 && <IntroScreenOne onAdvance={() => advanceTo(2)} />}
            {step === 2 && <IntroScreenTwo onAdvance={() => advanceTo(3)} />}
            {step === 3 && <IntroScreenThree onAdvance={() => advanceTo(4)} />}
            {step === 4 && <IntroScreenFour onAdvance={handleFinish} />}
          </motion.div>
        </AnimatePresence>
      </IntroPanelShell>
    </div>
  );
}
