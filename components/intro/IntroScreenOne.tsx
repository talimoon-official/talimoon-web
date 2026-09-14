"use client";

/**
 * Screen 01 of the TALIMOON homepage entrance experience. See
 * HomeIntroExperience.tsx for the shell (first-visit gating, scroll
 * lock, focus trap) this mounts inside.
 *
 * FLOATING PANEL CONCEPT (final visual direction): the intro is NOT a
 * fullscreen takeover. This root div is the invisible full-viewport
 * "focus layer" — a light warm veil + a restrained backdrop-blur, just
 * enough to separate foreground from background — and the real
 * TALIMOON homepage must stay visible and recognizable through it.
 * All actual intro content lives inside one small, centered `panel`
 * div sized to a controlled max-width per breakpoint, never close to
 * filling the viewport.
 *
 * Inside the panel: one relative "stage", no column grid. The
 * character (see IntroCharacterMedia — invisible wrapper, no card) is
 * an absolutely positioned presence in the panel's right-side negative
 * space. Text never overlaps her: the {progress, heading, question}
 * group carries a right-side reservation (`pr-*`) sized to roughly her
 * rendered width at each breakpoint, so wrapping keeps clear of her by
 * construction rather than by eyeballing. The CTA sits outside that
 * reservation (compact + left-aligned, so it's never in her zone
 * regardless of vertical overlap).
 *
 * Reveal: opacity + small translateY only, timed per the approved
 * sequence, skipped entirely under prefers-reduced-motion (same
 * `useReducedMotion` + conditional-props pattern as AboutHero.tsx).
 *
 * The full-viewport veil and the floating panel itself now live in
 * IntroPanelShell.tsx (shared by every intro screen so Screens 02-04
 * don't duplicate that markup) — this component renders only the
 * panel's internal "stage" and is rendered as IntroPanelShell's
 * children by HomeIntroExperience. Extracting that shell reproduced
 * this file's veil/panel classes exactly, so Screen 01 stays visually
 * identical to its locked, approved state.
 *
 * Copy is read via `useT` from lib/intro/introCopy.ts (the same
 * pattern every other localized TALIMOON component uses) instead of
 * being hard-coded, now that the intro is production-multilingual —
 * for the active language = UZ, the rendered text is byte-identical to
 * the original locked strings.
 */

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useT } from "@/lib/i18n/LanguageContext";
import { introScreenOneCopy } from "@/lib/intro/introCopy";
import { IntroProgress } from "./IntroProgress";
import { IntroCharacterMedia } from "./IntroCharacterMedia";

const EASE = [0.16, 1, 0.3, 1] as const;

// Absolute seconds from mount, per the approved reveal sequence.
const REVEAL = {
  meta: 0,
  character: 0.2,
  line1: 0.35,
  line2: 0.6,
  question: 1.0,
  cta: 2.0,
};

export function IntroScreenOne({ onAdvance }: { onAdvance: () => void }) {
  const reduced = useReducedMotion();
  const [animationDone, setAnimationDone] = useState(false);
  const t = useT(introScreenOneCopy.en, introScreenOneCopy.uz, introScreenOneCopy.ru);

  // Under reduced motion the CTA's own reveal `motion.div` never
  // animates (it mounts straight into its end state via `initial:
  // false`), so `onAnimationComplete` below would never fire — derive
  // readiness instead of syncing it via an effect, so reduced motion
  // makes the CTA interactive immediately without ever needing it.
  const ctaReady = reduced === true || animationDone;

  const reveal = (delay: number, y = 10) =>
    reduced
      ? { initial: false as const, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: EASE },
        };

  return (
    // Stage — one relative composition, no column grid.
    <div className="relative">
      {/* Character — absolutely positioned in the right-side
          negative space, no visible container of any kind (see
          IntroCharacterMedia). Sized relative to the PANEL, not
          the viewport. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -top-6 aspect-[2/3] h-[145px] sm:h-[150px] md:right-0 md:top-0 md:h-[260px] lg:right-0 lg:top-1/2 lg:h-[320px] lg:-translate-y-1/2"
      >
        <motion.div className="h-full w-full" {...reveal(REVEAL.character, 8)}>
          <IntroCharacterMedia />
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col items-start">
        {/* Progress + heading + question share a right-side
            reservation matching the character's rendered width, so
            wrapping keeps clear of her regardless of copy length. */}
        <div className="pr-[80px] sm:pr-[85px] md:pr-[190px] lg:pr-[250px]">
          <motion.div {...reveal(REVEAL.meta, 4)}>
            <IntroProgress step={1} />
          </motion.div>

          <h1
            id="tm-intro-heading"
            tabIndex={-1}
            className="mt-4 font-sans uppercase leading-[1.08] tracking-[-0.01em] text-surface-contrast outline-none"
          >
            <motion.span
              className="block text-[30px] font-bold md:text-[34px] lg:text-[38px]"
              {...reveal(REVEAL.line1)}
            >
              {t.headlineLine1}
            </motion.span>
            <motion.span
              className="block text-[30px] font-extrabold md:text-[34px] lg:text-[38px]"
              {...reveal(REVEAL.line2, 6)}
            >
              {t.headlineLine2}
            </motion.span>
          </h1>

        </div>

        <motion.p
          className="mt-3 font-display text-[22px] leading-[1.32] text-text-primary md:pr-[190px] md:text-[25px] lg:pr-[250px] lg:text-[28px]"
          {...reveal(REVEAL.question)}
        >
          {t.questionLine1}
          <br /> {t.questionLine2}
        </motion.p>

        {/* CTA — outside the reservation: compact and left-aligned,
            so it never sits in the character's zone regardless of
            vertical overlap. */}
        <motion.div className="mt-6" {...reveal(REVEAL.cta, 8)} onAnimationComplete={() => setAnimationDone(true)}>
          <button
            type="button"
            onClick={onAdvance}
            disabled={!ctaReady}
            className="group inline-flex h-11 items-center gap-2 rounded-[8px] bg-surface-contrast px-5 font-sans text-[13.5px] font-semibold tracking-[0.01em] text-text-inverse transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary disabled:pointer-events-none"
          >
            {t.cta}
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
