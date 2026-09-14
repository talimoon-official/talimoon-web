"use client";

/**
 * Top-level orchestrator for TALIMOON's first-visit experience:
 * Language Gate (if this browser has never chosen a language) -> the
 * four-screen intro (if not yet completed) -> nothing (normal
 * homepage, mounted directly in the previously chosen language).
 * Mounted once in app/page.tsx, replacing the old direct
 * `<HomeIntroExperience />` mount.
 *
 * Owns the one shared modal shell across both phases: the dialog
 * wrapper, scroll-lock and Tab-cycle focus trap, plus the single
 * IntroPanelShell instance both LanguageGate and HomeIntroExperience
 * render inside — the shell is not duplicated per phase (spec §11).
 *
 * Phase is a small deterministic derivation from two independent
 * persisted flags, not a set of booleans that could together describe
 * an impossible state (spec §31 — Gate and intro visible at once
 * cannot happen, since phase is a single if/else):
 *
 *   no chosen language            -> "gate", regardless of intro
 *                                     completion (covers a migrated
 *                                     browser that has intro-seen but
 *                                     no language — spec §6 CASE D)
 *   chosen language, intro unseen -> "intro", starting at Screen 01
 *   chosen language, intro seen,
 *     not forced                  -> closed, direct homepage
 *   `?intro=1`                    -> same branching, ignoring
 *                                     intro-seen (forced preview)
 *
 * Language selection updates lib/i18n/LanguageContext.tsx's ONE
 * language store via `setLanguage` — there is no second/competing
 * language source (spec §4). `setLanguage` is a synchronous
 * localStorage write + listener notification (not a network request
 * or an animation), so by the time HomeIntroExperience first mounts
 * after a Gate selection, `useT` inside Screen 01 is already reading
 * the newly-selected language — no wrong-language flash (spec §22).
 */

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage, useHasChosenLanguage } from "@/lib/i18n/LanguageContext";
import { useIntroCompletion } from "@/lib/intro/useIntroCompletion";
import { IntroPanelShell } from "./IntroPanelShell";
import { LanguageGate } from "./LanguageGate";
import { HomeIntroExperience } from "./HomeIntroExperience";

const EASE = [0.16, 1, 0.3, 1] as const;

type Phase = "gate" | "intro";

export function FirstVisitExperience() {
  const { setLanguage } = useLanguage();
  const hasChosenLanguage = useHasChosenLanguage();
  const { introSeen, forced, complete } = useIntroCompletion();
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const visible = !hasChosenLanguage || !introSeen || forced;
  const phase: Phase = hasChosenLanguage ? "intro" : "gate";

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

  // Move focus to the new phase's heading on every Gate -> intro
  // change, except the very first render (the effect above already
  // focused the container itself when the experience opened).
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (!visible) return;
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    document.getElementById("tm-intro-heading")?.focus();
  }, [phase, visible]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tm-intro-heading"
      tabIndex={-1}
      className="fixed inset-0 z-[1000] outline-none"
    >
      <IntroPanelShell variant={phase === "gate" ? "dark" : "light"}>
        <motion.div
          key={phase}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          {phase === "gate" ? (
            <LanguageGate onSelect={(language) => setLanguage(language)} />
          ) : (
            <HomeIntroExperience onComplete={complete} />
          )}
        </motion.div>
      </IntroPanelShell>
    </div>
  );
}
