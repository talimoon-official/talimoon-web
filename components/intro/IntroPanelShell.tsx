"use client";

/**
 * Shared shell for every screen of the TALIMOON homepage entrance
 * experience: the full-viewport focus layer (warm veil + restrained
 * backdrop-blur — the ONLY element allowed to span the viewport) and
 * the small floating premium panel inside it. Extracted from
 * IntroScreenOne.tsx (Screen 01 is visually locked — this reproduces
 * its exact veil/panel markup and classes, not a redesign) so Screens
 * 02-04 share one panel instance instead of duplicating the shell four
 * times. The panel itself mounts once for the whole intro lifetime;
 * only its `children` (the active screen's stage) swap underneath it,
 * which is why the panel-entrance reveal below only ever plays once,
 * on first mount, not on every screen change.
 *
 * `layout` lets the panel's height animate smoothly when the content
 * inside it changes size between screens (framer-motion FLIP) instead
 * of jumping — disabled under reduced motion, where height should just
 * snap with no animation dependency.
 */

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

export function IntroPanelShell({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  const panelReveal = reduced
    ? { initial: false as const, animate: { opacity: 1, y: 0, scale: 1 } }
    : {
        initial: { opacity: 0, y: 10, scale: 0.985 },
        animate: { opacity: 1, y: 0, scale: 1 },
      };

  return (
    // Full-viewport FOCUS LAYER — a light warm veil + restrained blur.
    // This is the only element that spans the whole screen; it must
    // keep the homepage behind it clearly recognizable, not hide it.
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-[#F7F3EC]/[0.35] px-4 py-10 backdrop-blur-[6px] sm:px-6">
      {/* THE PANEL — the only thing that actually looks like "the
          intro". Controlled width per breakpoint, content-driven
          height, generous visible homepage on every side. */}
      <motion.div
        {...panelReveal}
        layout={!reduced}
        transition={{ duration: 0.5, ease: EASE, layout: { duration: 0.4, ease: EASE } }}
        className="relative w-full max-w-[400px] rounded-[28px] border border-border-subtle bg-surface-raised px-6 py-6 shadow-elevated sm:max-w-[420px] sm:px-7 sm:py-7 md:max-w-[660px] md:px-9 md:py-9 lg:max-w-[820px] lg:px-12 lg:py-11"
      >
        {children}
      </motion.div>
    </div>
  );
}
