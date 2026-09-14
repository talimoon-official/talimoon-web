"use client";

/**
 * Screen 02 — "behavior reset": BU YER REELS EMAS. Renders as
 * IntroPanelShell's children (see HomeIntroExperience.tsx) — same
 * shell as every other screen.
 *
 * COMPOSITION (revised 2026-09-14, owner-rejected the prior corner
 * treatment): the guide is one of the two primary visual elements of
 * the intro, not a mascot filling leftover space — she stands in her
 * own CHARACTER ZONE beside the message instead of being absolutely
 * positioned over a corner. `sm:flex-row` splits the stage into a
 * flexible TEXT ZONE (`flex-1`, ends up ~63-68% of the row depending
 * on breakpoint) and a fixed-width CHARACTER ZONE
 * (`CHARACTER_ZONE_WIDTH`, ~32-38%) — the same two-zone system used by
 * IntroScreenThree.tsx/IntroScreenFour.tsx so no screen invents its
 * own one-off scale. Below `sm` (a real 390-430px phone) the row
 * stacks (`flex-col`): text first, then the character block, still at
 * a deliberate size — not a shrunk-to-fit corner icon.
 *
 * `self-end` on the character wrapper does double duty across the
 * layout's two axes: in the stacked mobile column its cross-axis is
 * horizontal, so it right-aligns her under the text (keeping her on
 * the same side as the desktop composition); once `sm:flex-row` flips
 * the cross-axis to vertical, the same class bottom-aligns her with
 * the text baseline — grounded, not floating between top and bottom.
 * No card/circle/gradient/shadow behind her — the bare transparent
 * asset only (see IntroCharacterMedia).
 *
 * Typography stays the dominant visual anchor (per spec, the message
 * is the primary intellectual focus); the character is a real
 * participant, not decoration. The two emphasized closing lines still
 * get one restrained gold rule as the screen's single editorial motif
 * instead of new colors or icons (spec §14).
 */

import { useT } from "@/lib/i18n/LanguageContext";
import { IntroProgress } from "./IntroProgress";
import { IntroCharacterMedia } from "./IntroCharacterMedia";
import { introScreenTwoCopy } from "@/lib/intro/introCopy";

const CHARACTER_ZONE_WIDTH = "w-[150px] md:w-[190px] lg:w-[230px]";

export function IntroScreenTwo({ onAdvance }: { onAdvance: () => void }) {
  const t = useT(introScreenTwoCopy.en, introScreenTwoCopy.uz, introScreenTwoCopy.ru);

  return (
    <div className="relative">
      <div className="flex flex-col gap-5 sm:flex-row sm:gap-6 md:gap-8">
        <div className="flex min-w-0 flex-1 flex-col items-start">
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

          <div className="mt-5 border-l-2 border-accent-primary py-0.5 pl-4">
            <p className="font-sans text-[16px] font-semibold leading-[1.45] text-text-primary md:text-[18px]">
              {t.bodyPrimary}
            </p>
            <p className="mt-2 font-sans text-[16px] font-semibold leading-[1.45] text-text-primary md:text-[18px]">
              {t.bodySecondary}
            </p>
          </div>
        </div>

        {/* Character zone — a real participant beside the message, not
            a corner decoration. No container of any kind (see
            IntroCharacterMedia): the bare transparent asset sits
            directly on the ivory panel. */}
        <div
          aria-hidden="true"
          className={`aspect-[2/3] shrink-0 self-end ${CHARACTER_ZONE_WIDTH}`}
        >
          <IntroCharacterMedia />
        </div>
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
  );
}
