"use client";

/**
 * The four-screen editorial journey itself (01 attention -> 02
 * behavior reset -> 03 redefine TALIMOON -> 04 curiosity). Mounted by
 * FirstVisitExperience.tsx as IntroPanelShell's children once a
 * language is known — this component owns only the step state machine
 * and the step-to-step transition. The dialog wrapper, scroll-lock,
 * Tab-cycle focus trap, and the Language Gate / intro-completion
 * gating all live one level up in FirstVisitExperience now.
 *
 * Step transition: a single `motion.div` keyed by `step`, enter-only
 * (no `exit`/`AnimatePresence`) — see the production bug this fixed:
 * `AnimatePresence mode="wait"` withheld mounting the incoming screen
 * until the outgoing one's exit animation reported finished via
 * `onExitComplete`, a callback that can be delayed or dropped (tab
 * throttling, a slow device, a skipped frame), so a CTA click could
 * update `step` internally while the visible screen never advanced.
 * React's own key-change reconciliation now unmounts the outgoing
 * screen and mounts the incoming one on the same commit that updates
 * `step`, so the DOM always reflects `step` immediately — navigation
 * never depends on a decorative animation completing.
 *
 * Focus: moves to the incoming screen's heading on every step change
 * except the very first render — FirstVisitExperience already moved
 * focus to `#tm-intro-heading` when this component first mounted
 * (either as the very first phase, or right after the Language Gate),
 * so re-focusing it again on this component's own first render would
 * just be a redundant second jump.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { IntroScreenOne } from "./IntroScreenOne";
import { IntroScreenTwo } from "./IntroScreenTwo";
import { IntroScreenThree } from "./IntroScreenThree";
import { IntroScreenFour } from "./IntroScreenFour";

const EASE = [0.16, 1, 0.3, 1] as const;

type Step = 1 | 2 | 3 | 4;

export function HomeIntroExperience({ onComplete }: { onComplete: () => void }) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState<Step>(1);
  // Guards rapid double-clicks on a CTA from advancing more than one
  // step or firing `onComplete` twice — cleared once the step
  // transition has had time to finish.
  const advancingRef = useRef(false);

  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    document.getElementById("tm-intro-heading")?.focus();
  }, [step]);

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
    onComplete();
  }

  return (
    <motion.div
      key={step}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      {step === 1 && <IntroScreenOne onAdvance={() => advanceTo(2)} />}
      {step === 2 && <IntroScreenTwo onAdvance={() => advanceTo(3)} />}
      {step === 3 && <IntroScreenThree onAdvance={() => advanceTo(4)} />}
      {step === 4 && <IntroScreenFour onAdvance={handleFinish} />}
    </motion.div>
  );
}
