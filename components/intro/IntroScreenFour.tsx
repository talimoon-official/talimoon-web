"use client";

/**
 * Screen 04 — the final curiosity gap: something specific to the
 * visitor (or their child) is hidden somewhere on the site; go find
 * it. Quietest and most negative-space screen of the four (spec §24/
 * §53): no treasure, gift, map, or game graphics — the mystery lives
 * in copy, spacing and composition only. "YASHIRINGAN" gets restrained
 * emphasis via the same accent-primary token used for "farzandingiz"
 * on Screen 03 (weight + color only, no glow).
 *
 * COMPOSITION (revised 2026-09-14, owner-rejected the prior corner
 * treatment — see IntroScreenTwo.tsx for the full rationale, shared
 * verbatim by this screen): same two-zone TEXT/CHARACTER row system,
 * `CHARACTER_ZONE_WIDTH` only. The guide is not "quietest and most
 * peripheral" anymore in scale (the corner-mascot treatment that
 * language described is exactly what was rejected) — she stays at the
 * standard Screens-02/04 size (Screen 03 alone runs slightly larger,
 * per its own warmer composition) and, on this closing screen, reads
 * as inviting the visitor in: same open-hand gesture, same bare
 * transparent asset, no container.
 */

import { useT } from "@/lib/i18n/LanguageContext";
import { IntroProgress } from "./IntroProgress";
import { IntroCharacterMedia } from "./IntroCharacterMedia";
import { introScreenFourCopy } from "@/lib/intro/introCopy";

const CHARACTER_ZONE_WIDTH = "w-[150px] md:w-[190px] lg:w-[230px]";

export function IntroScreenFour({ onAdvance }: { onAdvance: () => void }) {
  const t = useT(introScreenFourCopy.en, introScreenFourCopy.uz, introScreenFourCopy.ru);

  return (
    <div className="relative">
      <div className="flex flex-col gap-5 sm:flex-row sm:gap-6 md:gap-8">
        <div className="flex min-w-0 flex-1 flex-col items-start">
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

          <div className="mt-5 space-y-2">
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
        </div>

        {/* Character zone — same bare-asset, no-container treatment as
            every other screen (see IntroCharacterMedia). */}
        <div
          aria-hidden="true"
          className={`aspect-[2/3] shrink-0 self-end ${CHARACTER_ZONE_WIDTH}`}
        >
          <IntroCharacterMedia />
        </div>
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
  );
}
