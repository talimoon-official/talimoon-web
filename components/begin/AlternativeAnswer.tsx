"use client";

/**
 * TALIMOON — ORDER — the alternative answer.
 * ----------------------------------------------------------------
 * The ONE pattern for every "none / I don't know / nothing to add"
 * response in the order flow. It sits under the free-text field (or the
 * choice list) as a real answer in its own right, not a skip link:
 *
 *     [ textarea ]
 *        ──── YOKI ────
 *     [ ○  Bu borada xavotirim yo‘q ]
 *
 * The whole card is the target (a visually-hidden native checkbox inside
 * a <label>, so Space / click / screen readers all work). Selected state
 * is never colour-only: the ring fills and carries a check mark. The
 * caller owns exclusivity — typing clears the card, choosing the card
 * clears the text — so the stored answer is always one or the other.
 */

import { Check } from "lucide-react";

/** The separator word, per locale. */
export const ALT_OR_LABEL = { uz: "YOKI", en: "OR", ru: "ИЛИ" } as const;
export type AltLocale = keyof typeof ALT_OR_LABEL;

export function AlternativeAnswer({
  id,
  selected,
  onChange,
  label,
  locale,
  support,
  separator = true,
}: {
  id: string;
  selected: boolean;
  onChange: (selected: boolean) => void;
  /** A short, natural answer to THIS question, in the parent's voice. */
  label: string;
  locale: AltLocale;
  /** Optional one-line note under the card (e.g. what choosing it clears). */
  support?: string;
  /** The "YOKI" divider above the card (on by default). */
  separator?: boolean;
}) {
  return (
    <div data-alternative-answer="">
      {separator && (
        <div className="mb-3.5 mt-5 flex items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-border-default" />
          <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.22em] text-text-muted">
            {ALT_OR_LABEL[locale]}
          </span>
          <span className="h-px flex-1 bg-border-default" />
        </div>
      )}
      <label
        htmlFor={id}
        className={[
          "flex min-h-[60px] w-full cursor-pointer items-center gap-3.5 rounded-md border px-4 py-3.5 font-sans text-[16px] leading-[1.4] text-text-primary transition-[border-color,background-color] duration-200 sm:px-5",
          "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-primary",
          selected
            ? "border-accent-primary bg-accent-primary/[0.09]"
            : "border-accent-primary/60 bg-surface-raised hover:border-accent-primary/90",
        ].join(" ")}
      >
        <input
          id={id}
          type="checkbox"
          checked={selected}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className={[
            "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-200",
            selected
              ? "border-accent-primary bg-accent-primary text-white"
              : "border-accent-primary/75 bg-transparent",
          ].join(" ")}
        >
          {selected && <Check size={13} strokeWidth={3} />}
        </span>
        <span className={selected ? "font-medium" : undefined}>{label}</span>
      </label>
      {support && (
        <p className="mt-2 font-sans text-[13px] leading-[1.55] text-text-secondary">{support}</p>
      )}
    </div>
  );
}

export default AlternativeAnswer;
