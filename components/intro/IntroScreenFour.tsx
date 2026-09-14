"use client";

/**
 * Screen 04 — the final curiosity gap: something specific to the
 * visitor (or their child) is hidden somewhere on the site; go find
 * it. Quietest and most negative-space screen of the four (spec §24/
 * §53): no treasure, gift, map, or game graphics — the mystery lives
 * in copy, spacing and composition only. The guide character returns
 * smallest and most peripheral of all four screens — inviting, not
 * dominant. "YASHIRINGAN" gets restrained emphasis via the same
 * accent-primary token used for "farzandingiz" on Screen 03 (weight +
 * color only, no glow).
 */

import { useT } from "@/lib/i18n/LanguageContext";
import { IntroProgress } from "./IntroProgress";
import { IntroCharacterMedia } from "./IntroCharacterMedia";
import { introScreenFourCopy } from "@/lib/intro/introCopy";

export function IntroScreenFour({ onAdvance }: { onAdvance: () => void }) {
  const t = useT(introScreenFourCopy.en, introScreenFourCopy.uz, introScreenFourCopy.ru);

  return (
    <div className="relative">
      {/* Character — quietest presence of the four: small, bottom-right,
          same approved asset, no container. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 -bottom-2 aspect-[2/3] h-[70px] sm:h-[75px] md:h-[110px] lg:h-[130px]"
      >
        <IntroCharacterMedia />
      </div>

      <div className="relative z-10 flex flex-col items-start">
        <IntroProgress step={4} />

        <h1
          id="tm-intro-heading"
          tabIndex={-1}
          className="mt-5 font-sans text-[26px] font-extrabold uppercase leading-[1.15] tracking-[-0.01em] text-surface-contrast outline-none sm:text-[28px] md:text-[32px] lg:text-[36px]"
        >
          {t.headlineBefore}
          <span className="text-accent-primary">{t.headlineEmphasis}</span>
          {t.headlineAfter}
        </h1>

        <div className="mt-5 space-y-2 pr-[45px] sm:pr-[48px] md:pr-[85px] lg:pr-[100px]">
          <p className="font-display text-[17px] leading-[1.5] text-text-primary md:text-[19px]">
            {t.bodyLine1}
          </p>
          <p className="font-display text-[17px] leading-[1.5] text-text-primary md:text-[19px]">
            {t.bodyLine2}
          </p>
          <p className="font-display text-[17px] leading-[1.5] text-text-primary md:text-[19px]">
            {t.bodyLine3}
          </p>
        </div>

        <div className="mt-7">
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
    </div>
  );
}
