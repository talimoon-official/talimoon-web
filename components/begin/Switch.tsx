"use client";

/**
 * TALIMOON — ORDER — the one switch primitive.
 * ----------------------------------------------------------------
 * The single true binary on/off control for the order flow (add a
 * personal message, include other characters, add the closing-page
 * photo). NOT for "none / I don't know" answers — those are the
 * `AlternativeAnswer` card.
 *
 * DETERMINISTIC GEOMETRY (identical in OFF / ON / hover / focus /
 * disabled — nothing else moves):
 *   track  36 × 20, pill radius, box-border
 *   thumb  16 × 16, positioned absolutely at left/top 2px
 *   travel translateX(16px)  →  ON thumb = 2..34 in x, 2..18 in y
 * The thumb is always fully inside the track. The track never moves,
 * resizes, or changes padding/border between states — only the thumb
 * transform and the track background-color animate (~200ms).
 *
 * Touch target is ~44×44 via an invisible `::before`; the visible
 * track stays 36×20.
 */

import React from "react";

export function Switch({
  checked,
  onChange,
  disabled,
  id,
  ariaLabel,
  ariaLabelledby,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative box-border block h-5 w-9 shrink-0 rounded-pill outline-none",
        "transition-colors duration-200 ease-out",
        "before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
        "focus-visible:ring-2 focus-visible:ring-accent-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
        "disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "bg-accent-primary" : "bg-text-primary/[0.16]",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-white shadow-[0_1px_1.5px_rgba(28,42,58,0.18)] transition-transform duration-200 ease-out"
        style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

/**
 * A switch on its own row: label left, switch right. The whole row is
 * one tab stop / one `role="switch"` so it stays tappable on mobile;
 * focus-visible is a restrained ring around the row, never a filled
 * gold card, and never changes the row's dimensions.
 */
export function SwitchRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-md border border-border-default px-3.5 py-3 text-left outline-none focus-visible:ring-1 focus-visible:ring-accent-primary/40 disabled:opacity-50"
    >
      <span className="min-w-0 font-sans text-[13.5px] font-medium text-text-primary">
        {label}
      </span>
      {/* Decorative here — the row itself carries role/aria-checked. */}
      <span
        aria-hidden="true"
        className={[
          "relative box-border block h-5 w-9 shrink-0 rounded-pill transition-colors duration-200 ease-out",
          checked ? "bg-accent-primary" : "bg-text-primary/[0.16]",
        ].join(" ")}
      >
        <span
          className="absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-white shadow-[0_1px_1.5px_rgba(28,42,58,0.18)] transition-transform duration-200 ease-out"
          style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
        />
      </span>
    </button>
  );
}

export default Switch;
