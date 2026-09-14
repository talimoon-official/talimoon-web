"use client";

/**
 * Screen 03 — "redefine TALIMOON": the conceptual reveal that TALIMOON
 * is a larger educational world for children AND parents, not "just a
 * book". Deliberately NOT a feature grid: the bilim/tarbiya/hikoyalar/
 * kashfiyotlar and ota-ona-tavsiyalari ideas stay two plain editorial
 * paragraphs, no icons or cards (spec §19/§52).
 *
 * COMPOSITION (revised 2026-09-14, owner-rejected the prior corner
 * treatment — see IntroScreenTwo.tsx for the full rationale, shared
 * verbatim by this screen): same two-zone TEXT/CHARACTER row system,
 * `CHARACTER_ZONE_WIDTH` only. This is the warmest "world reveal"
 * screen — she gets the strongest presence of Screens 02-04 here
 * (still built from the same shared system, just a larger constant),
 * presenting the wider TALIMOON world alongside the closing sentence
 * ("farzandingiz" at the center of it all), which keeps its restrained
 * typographic emphasis rather than a new color chip.
 *
 * MOBILE CORRECTION (2026-09-14, same day): see IntroScreenTwo.tsx —
 * same `self-center`-below-`sm`/right-gap treatment, this screen's own
 * (slightly larger) width constants unchanged.
 */

import { useT } from "@/lib/i18n/LanguageContext";
import { IntroProgress } from "./IntroProgress";
import { IntroCharacterMedia } from "./IntroCharacterMedia";
import { introScreenThreeCopy } from "@/lib/intro/introCopy";

const CHARACTER_ZONE_WIDTH = "w-[140px] sm:w-[165px] md:w-[210px] lg:w-[255px]";
const CHARACTER_RIGHT_GAP = "sm:mr-5 md:mr-7 lg:mr-9";

export function IntroScreenThree({ onAdvance }: { onAdvance: () => void }) {
  const t = useT(introScreenThreeCopy.en, introScreenThreeCopy.uz, introScreenThreeCopy.ru);

  return (
    <div className="relative">
      <div className="flex flex-col gap-5 sm:flex-row sm:gap-6 md:gap-8">
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <IntroProgress step={3} />

          <h1
            id="tm-intro-heading"
            tabIndex={-1}
            className="mt-4 font-sans text-[28px] font-extrabold uppercase leading-[1.1] tracking-[-0.01em] text-surface-contrast outline-none sm:text-[30px] md:text-[34px] lg:text-[38px]"
          >
            {t.headline}
          </h1>

          <div className="mt-4 space-y-2">
            <p className="font-display text-[17px] leading-[1.45] text-text-primary md:text-[19px]">
              {t.bodyChild}
            </p>
            <p className="font-display text-[17px] leading-[1.45] text-text-primary md:text-[19px]">
              {t.bodyParent}
            </p>
          </div>

          <p className="mt-4 font-sans text-[17px] font-semibold leading-[1.4] text-text-primary md:text-[19px]">
            {t.anchorPrefix}{" "}
            <span className="text-accent-primary">{t.anchorEmphasis}</span>
            {t.anchorSuffix}
          </p>
        </div>

        {/* Character zone — same bare-asset, no-container treatment as
            every other screen (see IntroCharacterMedia); the widest
            constant of Screens 02-04 for this screen's warmer, more
            present composition. */}
        <div
          aria-hidden="true"
          className={`aspect-[2/3] shrink-0 self-center sm:self-end ${CHARACTER_ZONE_WIDTH} ${CHARACTER_RIGHT_GAP}`}
        >
          <IntroCharacterMedia />
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={onAdvance}
          className="group inline-flex h-11 items-center gap-2 rounded-[8px] bg-surface-contrast px-5 font-sans text-[13.5px] font-semibold tracking-[0.01em] text-text-inverse transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          {t.cta}
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </button>
      </div>
    </div>
  );
}
