"use client";

/**
 * Screen 03 — "redefine TALIMOON": the conceptual reveal that TALIMOON
 * is a larger educational world for children AND parents, not "just a
 * book". Warmer and more open than Screen 02: the guide character
 * returns larger and more present (same approved asset, different
 * scale/position than Screens 01-02 — bottom-right here instead of
 * top-right/vertical-center, per spec §20), and the closing sentence
 * ("farzandingiz" at the center of it all) is the emotional anchor,
 * given restrained typographic emphasis rather than a new color chip.
 * Deliberately NOT a feature grid: the bilim/tarbiya/hikoyalar/
 * kashfiyotlar and ota-ona-tavsiyalari ideas stay two plain editorial
 * paragraphs, no icons or cards (spec §19/§52).
 */

import { IntroProgress } from "./IntroProgress";
import { IntroCharacterMedia } from "./IntroCharacterMedia";
import { introScreenThreeCopy as copy } from "@/lib/intro/introCopy";

export function IntroScreenThree({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="relative">
      {/* Character — same approved asset, warmer/larger than Screen 02,
          bottom-right so no two screens share a placement. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 -bottom-4 aspect-[2/3] h-[130px] sm:h-[140px] md:h-[220px] lg:h-[260px]"
      >
        <IntroCharacterMedia />
      </div>

      <div className="relative z-10 flex flex-col items-start">
        <IntroProgress step={3} />

        <h1
          id="tm-intro-heading"
          tabIndex={-1}
          className="mt-4 font-sans text-[28px] font-extrabold uppercase leading-[1.1] tracking-[-0.01em] text-surface-contrast outline-none sm:text-[30px] md:text-[34px] lg:text-[38px]"
        >
          {copy.headline.uz}
        </h1>

        <div className="mt-4 space-y-2 pr-[70px] sm:pr-[75px] md:pr-[130px] lg:pr-[150px]">
          <p className="font-display text-[17px] leading-[1.45] text-text-primary md:text-[19px]">
            {copy.bodyChild.uz}
          </p>
          <p className="font-display text-[17px] leading-[1.45] text-text-primary md:text-[19px]">
            {copy.bodyParent.uz}
          </p>
        </div>

        <p className="mt-4 pr-[70px] font-sans text-[17px] font-semibold leading-[1.4] text-text-primary sm:pr-[75px] md:pr-[130px] md:text-[19px] lg:pr-[150px]">
          {copy.anchorPrefix.uz}{" "}
          <span className="text-accent-primary">{copy.anchorEmphasis.uz}</span>{" "}
          {copy.anchorSuffix.uz}
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={onAdvance}
            className="group inline-flex h-11 items-center gap-2 rounded-[8px] bg-surface-contrast px-5 font-sans text-[13.5px] font-semibold tracking-[0.01em] text-text-inverse transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
          >
            {copy.cta.uz}
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
