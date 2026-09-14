"use client";

/**
 * The entrance decision before the editorial intro journey: a
 * brand-new visitor with no persisted TALIMOON language picks one of
 * O‘zbekcha / English / Русский before anything else happens. Renders
 * inside IntroPanelShell's `variant="dark"` surface (see
 * FirstVisitExperience.tsx) — same shell shape/scale/motion as every
 * intro screen, but a deep-navy ceremonial surface instead of the
 * screens' warm ivory, by deliberate art-direction contrast: this is
 * the one dark, distinctive entrance moment before Screens 01-04
 * open into a bright editorial story. Text here reads in the shell's
 * cream/gold-on-navy tokens (text-inverse / text-inverse-muted /
 * accent-primary); the language option tiles stay warm ivory
 * (surface-raised) so they read as lit entrances set into the dark
 * panel, not further navy-on-navy. This is NOT intro step "00/04": no
 * IntroProgress here (spec §9), no character by default (restraint
 * preferred over mechanically forcing her in, spec §33).
 *
 * The visitor hasn't chosen a language yet, so the welcome copy itself
 * can't be localized — all three languages are shown together,
 * deliberately small and unhurried (spec §13/§14), with the language
 * choices themselves as the one prominent interaction.
 *
 * One click commits: `handleSelect` calls `onSelect` immediately and
 * synchronously — FirstVisitExperience's cue to update the shared
 * language source and swap to Screen 01 — no separate "Continue"
 * button (spec §20) and, per spec §32, no delay of any kind gating
 * that navigation. An earlier version gave ~200ms of visual feedback
 * before calling `onSelect` via `window.setTimeout`; in a throttled or
 * backgrounded tab that timer can be delayed indefinitely (verified: a
 * click landed, `selected` updated, the gold underline appeared — and
 * the actual navigation never followed), which is exactly the
 * navigation-depends-on-timing bug class already fixed once in
 * HomeIntroExperience's screen transitions. The `selected` state below
 * still renders instantly (for the single frame before this component
 * unmounts) and the crossfade into Screen 01 itself provides the
 * confirmation — a delay was never necessary for that to feel
 * deliberate.
 */

import { useState } from "react";

type GateLanguage = "UZ" | "EN" | "RU";

const LANGUAGES: { code: GateLanguage; label: string }[] = [
  { code: "UZ", label: "O‘zbekcha" },
  { code: "EN", label: "English" },
  { code: "RU", label: "Русский" },
];

const WELCOME = [
  { headline: "TALIMOON’GA XUSH KELIBSIZ", sub: "Davom etish uchun tilni tanlang." },
  { headline: "WELCOME TO TALIMOON", sub: "Choose your language to continue." },
  { headline: "ДОБРО ПОЖАЛОВАТЬ В TALIMOON", sub: "Выберите язык, чтобы продолжить." },
];

export function LanguageGate({ onSelect }: { onSelect: (language: GateLanguage) => void }) {
  const [selected, setSelected] = useState<GateLanguage | null>(null);

  function handleSelect(code: GateLanguage) {
    setSelected(code);
    onSelect(code);
  }

  return (
    <div className="relative flex flex-col items-start">
      {/* Accessible/focus-target heading for the dialog — the three
          welcome lines below are deliberately coequal, so no single
          one of them is "the" heading; this stays visually hidden. */}
      <h1 id="tm-intro-heading" tabIndex={-1} className="sr-only outline-none">
        TALIMOON
      </h1>

      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-text-inverse-muted">
        TALIMOON
      </span>

      <div className="mt-4 space-y-3">
        {WELCOME.map((w) => (
          <div key={w.headline}>
            <p className="font-display text-[13px] font-semibold leading-snug text-text-inverse sm:text-[14px] md:text-[15px] lg:text-[16px]">
              {w.headline}
            </p>
            <p className="mt-0.5 font-sans text-[11px] leading-snug text-text-inverse-muted sm:text-[12px] md:text-[13px] lg:text-[14px]">
              {w.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row sm:gap-3">
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => handleSelect(code)}
            className={`group relative flex-1 rounded-[14px] border px-5 py-4 text-center font-sans text-[15px] font-semibold text-surface-contrast transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary ${
              selected === code
                ? "border-accent-primary bg-surface-contrast/[0.04]"
                : "border-border-subtle bg-surface-raised hover:-translate-y-0.5 hover:border-surface-contrast/30 hover:bg-surface-contrast/[0.03]"
            }`}
          >
            <span className="relative z-10">{label}</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 bottom-2 mx-auto h-[2px] rounded-full bg-accent-primary transition-all duration-200 ${
                selected === code ? "w-6" : "w-0 group-hover:w-6"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
