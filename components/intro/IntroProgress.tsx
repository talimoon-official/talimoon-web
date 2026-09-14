"use client";

/**
 * Editorial progress treatment shared by every intro screen — built to
 * take `step` 1..TOTAL_STEPS without any architectural change so
 * Screens 02–04 (not implemented yet) can reuse it as-is.
 * Deliberately not four dots: a label ("TALIMOON · 01 / 04") plus one
 * thin hairline that fills with a muted gold as steps advance.
 */

const TOTAL_STEPS = 4;

function pad(step: number) {
  return String(step).padStart(2, "0");
}

export function IntroProgress({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="whitespace-nowrap font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
        TALIMOON · {pad(step)} / {pad(TOTAL_STEPS)}
      </span>
      <span className="relative h-px w-full max-w-[88px] bg-border-default" aria-hidden="true">
        <span
          className="absolute inset-y-0 left-0 bg-accent-primary transition-[width] duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </span>
    </div>
  );
}
