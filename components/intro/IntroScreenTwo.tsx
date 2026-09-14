"use client";

/**
 * Screen 02 — "behavior reset": BU YER REELS EMAS. Renders as
 * IntroPanelShell's children (see HomeIntroExperience.tsx) — same
 * shell as every other screen, but the internal composition is more
 * typographic than Screen 01: the headline is the primary visual
 * anchor, and the guide character is smaller and tucked into the
 * corner (quieter presence — "read this," not "look at the mascot,"
 * per spec §13). The two emphasized closing lines get one restrained
 * gold rule as the screen's single editorial motif instead of new
 * colors or icons (spec §14).
 */

import { useT } from "@/lib/i18n/LanguageContext";
import { IntroProgress } from "./IntroProgress";
import { IntroCharacterMedia } from "./IntroCharacterMedia";
import { introScreenTwoCopy } from "@/lib/intro/introCopy";

export function IntroScreenTwo({ onAdvance }: { onAdvance: () => void }) {
  const t = useT(introScreenTwoCopy.en, introScreenTwoCopy.uz, introScreenTwoCopy.ru);

  return (
    <div className="relative">
      {/* Character — quieter than Screen 01: smaller, tucked into the
          corner, no visible container (see IntroCharacterMedia). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 -top-3 aspect-[2/3] h-[90px] sm:h-[95px] md:h-[150px] lg:h-[170px]"
      >
        <IntroCharacterMedia />
      </div>

      <div className="relative z-10 flex flex-col items-start">
        <div className="pr-[60px] sm:pr-[65px] md:pr-[120px] lg:pr-[140px]">
          <IntroProgress step={2} />

          <h1
            id="tm-intro-heading"
            tabIndex={-1}
            className="mt-4 font-sans text-[28px] font-extrabold uppercase leading-[1.1] tracking-[-0.01em] text-surface-contrast outline-none sm:text-[30px] md:text-[36px] lg:text-[40px]"
          >
            {t.headline}
          </h1>

          <p className="mt-3 font-display text-[16px] italic leading-[1.4] text-text-secondary md:text-[18px]">
            {t.lead}
          </p>
        </div>

        <div className="mt-5 border-l-2 border-accent-primary py-0.5 pl-4">
          <p className="font-sans text-[16px] font-semibold leading-[1.45] text-text-primary md:text-[18px]">
            {t.bodyPrimary}
          </p>
          <p className="mt-2 font-sans text-[16px] font-semibold leading-[1.45] text-text-primary md:text-[18px]">
            {t.bodySecondary}
          </p>
        </div>

        <div className="mt-6">
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
