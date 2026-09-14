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
 * open into a bright editorial story. This is NOT intro step "00/04":
 * no IntroProgress here (spec §9), no character by default (restraint
 * preferred over mechanically forcing her in, spec §33).
 *
 * COMPOSITION (revised 2026-09-14, owner-rejected the prior corner
 * treatment): centered, not left-aligned — every group
 * (masthead/rule/welcome/instructions/CTAs) is horizontally centered
 * inside a `max-w-[660px]` content column (the panel itself stays the
 * shared ~820px-at-lg width; this only narrows the CONTENT so it
 * doesn't stretch wall-to-wall, per spec §22). The panel's gold
 * perimeter (1px, `border-accent-primary`) lives on IntroPanelShell's
 * `variant="dark"` surface classes, not here — one border declaration,
 * not duplicated per screen.
 *
 * The three welcome lines are ONE typographic group (Uzbek primary in
 * Fraunces at display size, English/Russian smaller and lighter
 * underneath) — NOT three independent headline+caption blocks. The
 * three instruction sentences are a SEPARATE, single secondary group
 * below the whole welcome block, not attached one-per-language.
 *
 * Language CTAs reuse `.tm-cta-gold` verbatim (globals.css §27 — the
 * one production-approved gold-shimmer surface, already used by
 * Navbar's "Begin the Story" and Story Library's CTA) instead of a
 * bespoke gold treatment — per spec, this is a REUSE, not a new
 * interpretation of "gold". The old plain-ivory tiles + `selected`
 * local state + gold-underline affordance are gone: a solid gold
 * button doesn't need an underline to show it's interactive, and
 * `.tm-cta-gold:active` already gives instant pressed feedback for
 * the one frame before this component unmounts, so tracking
 * `selected` no longer served a purpose.
 *
 * One click commits: `onSelect` fires immediately and synchronously —
 * FirstVisitExperience's cue to update the shared language source and
 * swap to Screen 01 — no separate "Continue" button (spec §20) and no
 * delay of any kind gating that navigation (spec §32; see this file's
 * git history for the timer-based version this replaced and why it
 * was unsafe in a throttled/backgrounded tab).
 */

type GateLanguage = "UZ" | "EN" | "RU";

const LANGUAGES: { code: GateLanguage; label: string }[] = [
  { code: "UZ", label: "O‘zbekcha" },
  { code: "EN", label: "English" },
  { code: "RU", label: "Русский" },
];

const WELCOME_HEADLINES = [
  "TALIMOON’GA XUSH KELIBSIZ",
  "WELCOME TO TALIMOON",
  "ДОБРО ПОЖАЛОВАТЬ В TALIMOON",
];

const INSTRUCTIONS = [
  "Davom etish uchun tilni tanlang.",
  "Choose your language to continue.",
  "Выберите язык, чтобы продолжить.",
];

export function LanguageGate({ onSelect }: { onSelect: (language: GateLanguage) => void }) {
  return (
    <div className="relative mx-auto flex w-full max-w-[660px] flex-col items-center text-center">
      {/* Accessible/focus-target heading for the dialog — the three
          welcome lines below are deliberately coequal, so no single
          one of them is "the" heading; this stays visually hidden. */}
      <h1 id="tm-intro-heading" tabIndex={-1} className="sr-only outline-none">
        TALIMOON
      </h1>

      <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.24em] text-accent-primary md:text-[13px]">
        TALIMOON
      </span>

      <span aria-hidden="true" className="mt-3 h-px w-12 bg-accent-primary" />

      <div className="mt-5">
        <p className="font-display text-[22px] font-semibold leading-[1.15] text-text-inverse sm:text-[24px] md:text-[28px] lg:text-[32px]">
          {WELCOME_HEADLINES[0]}
        </p>
        <p className="mt-2 font-display text-[16px] leading-[1.25] text-text-inverse sm:text-[17px] md:text-[19px] lg:text-[21px]">
          {WELCOME_HEADLINES[1]}
        </p>
        <p className="mt-1.5 font-display text-[16px] leading-[1.25] text-text-inverse sm:text-[17px] md:text-[19px] lg:text-[21px]">
          {WELCOME_HEADLINES[2]}
        </p>
      </div>

      <div className="mt-6 space-y-0.5">
        {INSTRUCTIONS.map((line) => (
          <p
            key={line}
            className="font-sans text-[11px] font-normal leading-[1.6] text-text-inverse-muted sm:text-[12px] md:text-[13px] lg:text-[14px]"
          >
            {line}
          </p>
        ))}
      </div>

      <div className="mt-7 flex w-full flex-col items-center gap-3 md:flex-row md:justify-center md:gap-4">
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            className="tm-cta-gold flex h-[52px] w-[85%] items-center justify-center text-[15px] font-semibold tracking-[0.01em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary md:w-auto md:flex-1 md:max-w-[190px]"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
